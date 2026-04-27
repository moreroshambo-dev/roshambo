import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { internalMutation, internalQuery, mutation, query } from "../../_generated/server";
import { requireUser } from "../../libs/auth";
import { lockBalance, unlockBalance } from "../../libs/balances";
import { internal } from "../../_generated/api";
import { getOpponentFromQueue, getQueueByUserId, joinToQueue, leaveQueue } from "./libs/room";

const RPS_ROOMS_TABLE = 'rps_rooms' as const

export const getRoomByUser = internalQuery({
    args: {userId: v.id('users')},
    handler: async (ctx, args) => {
        const result = await Promise.all([
            ctx.db.query(RPS_ROOMS_TABLE).withIndex('by_creator', (q) => q.eq('creatorId', args.userId)).unique(),
            ctx.db.query(RPS_ROOMS_TABLE).withIndex('by_opponent', (q) => q.eq('opponentId', args.userId)).unique(),
        ])

        const room = result.reduce((acc, item) => acc || item)

        return room
    },
})

export const getRoomById = internalQuery({
    args: {roomId: v.id(RPS_ROOMS_TABLE)},
    handler: async (ctx, args) => {
        const room = await ctx.db.get(RPS_ROOMS_TABLE, args.roomId)

        return room
    },
})

export const internalJoin = internalMutation({
    args: {
        betAmount: v.number(),
        userId: v.id('users'),
    },
    handler: async (ctx, args) => {
        const room = await ctx.runQuery(internal.game.rcp.room.getRoomByUser, {userId: args.userId})

        if (room) {
            return
        }

        const queue = await getQueueByUserId(ctx, args.userId)
        
        if (queue) {
            return
        }

        const opponentQueue = await getOpponentFromQueue(ctx, args.userId, args.betAmount)

        if (opponentQueue) {
            await leaveQueue(ctx, opponentQueue.userId)

            const players = [opponentQueue.userId, args.userId]

            for (const id of players) {
                await lockBalance(ctx, {
                    userId: id,
                    amount: args.betAmount,
                })
            }

            const roomId = await ctx.db.insert(RPS_ROOMS_TABLE, {
                opponentId: opponentQueue.userId,
                creatorId: args.userId,
                betAmount: args.betAmount,
                totalPot: args.betAmount * 1.99,
            })

            await ctx.runMutation(internal.game.rcp.match.createMatchByRoomId, {roomId})
        } else {
            await joinToQueue(ctx, args.userId, args.betAmount)
        }
    }
})

export const join = mutation({
    args: {
        betAmount: v.number(),
    },
    handler: async (ctx, args) => {
        const {userId} = await requireUser(ctx)
        
        await ctx.runMutation(internal.game.rcp.room.internalJoin, {
            userId,
            betAmount: args.betAmount,
        })
    }
})

export const leaveByUserId = internalMutation({
    args: {userId: v.id('users')},
    handler: async (ctx, args) => {
        await leaveQueue(ctx, args.userId)

        const room = await ctx.runQuery(internal.game.rcp.room.getRoomByUser, {userId: args.userId})

        if (!room) {
            return;
        }

        const opponentId = room.opponentId === args.userId ? room.creatorId : room.opponentId;

        const match = await ctx.runQuery(internal.game.rcp.match.getMatchByRoomId, {roomId: room._id})
        
        if (match) {
            // `RPS_STAGES.TURN_RESOLVED` - единственная стадия где у игроком нет заблокированного баланса,
            // по этому если стадии НЕ `RPS_STAGES.TURN_RESOLVED` нужно снять блокировку со счета
            await unlockBalance(ctx, args.userId, room.betAmount)
            await unlockBalance(ctx, opponentId, room.betAmount)

            await ctx.runMutation(internal.game.rcp.match.deleteMatchById, {matchId: match._id});
        }

        await ctx.db.delete(RPS_ROOMS_TABLE, room._id)

        await ctx.runMutation(internal.game.rcp.room.internalJoin, {
            betAmount: room.betAmount,
            userId: opponentId,
        });
    },
}) 

export const leave = mutation({
    handler: async (ctx) => {
        const {userId} = await requireUser(ctx)

        await ctx.runMutation(internal.game.rcp.room.leaveByUserId, {userId})
    }
})

export const get = query({
    handler: async (ctx) => {
        const {userId} = await requireUser(ctx)
        const room = await ctx.runQuery(internal.game.rcp.room.getRoomByUser, {userId})

        if (room) {
            const creatorId: Id<'users'> = room.creatorId
            const opponentId: Id<'users'> = room.opponentId
            const isCreator = userId === creatorId
            
            const userA = await ctx.db.get('users', creatorId)
            const userB = await ctx.db.get('users', opponentId)

            const betAmount: number = room.betAmount
            const totalPot: number = room.totalPot

            return {
                status: 'active' as const,
                betAmount: betAmount,
                totalPot: totalPot,
                isCreator,
                you: {
                    name: userA?.name,
                    avatar: userA?.telegramPhotoUrl,
                },
                opponent: {
                    name: userB?.name,
                    avatar: userB?.telegramPhotoUrl,
                },
            }
        }

        const queuePosition = await getQueueByUserId(ctx, userId)

        if (!queuePosition) {
            return null
        }

        return {
            status: 'wait-opponent' as const,
            betAmount: queuePosition.betAmount,
        }
    }
})
