import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { requireUser } from "../../libs/auth";
import { getStageTimeLeftSeconds, resolveMatchResult, resolveRPSWinner, RPS_STAGES, RPS_STAGES_VALIDATOR, RPS_TABLES, RPS_TURN_VALIDATOR, type RpsTurn } from "./libs/rps";
import { creditBalance, deductBlockedFunds, lockBalance, LockBalanceError } from "../../libs/balances";
import { createMatch, deleteMatch, setStageAndScheduleNext } from "./libs/match";

export const getMatchByRoomId = internalQuery({
    args: {roomId: v.id('rps_rooms')},
    handler: async (ctx, args) => {
        const currentMatch = await ctx.db.query(RPS_TABLES.MATCHES).withIndex('by_roomId', (q) => q.eq('roomId', args.roomId)).unique()

        return currentMatch        
    }
})

export const deleteMatchById = internalMutation({
    args: {
        matchId: v.id(RPS_TABLES.MATCHES)
    },
    handler: async (ctx, args) => {
        await deleteMatch(ctx, args.matchId)
    }
})

export const createMatchByRoomId = internalMutation({
    args: {roomId: v.id('rps_rooms')},
    handler: async (ctx, args) => {
        const matchId = await createMatch(ctx, args.roomId)

        return matchId
    }
})

/**
 * Внутренний метод для смены стадии матча. Работает с `ctx.scheduler`, создает
 * и отменяет таймеры для перехода к следующим этапам.
 */
export const goToMatchStage = internalMutation({
    args: {
        matchId: v.id(RPS_TABLES.MATCHES),
        stage: RPS_STAGES_VALIDATOR,
    },
    handler: async (ctx, args) => {
        const match = await ctx.db.get(RPS_TABLES.MATCHES, args.matchId)

        if (!match) {
            throw new Error('goToMatchStage: match is nil')
        }

        const room = await ctx.runQuery(internal.game.rcp.room.getRoomById, {roomId: match.roomId})
        // Комната могла быть удалена (например, игрок ливнул) между планированием и исполнением шедулера.
        // В этом случае удаляем зависший матч и выходим без ошибки, чтобы не блокировать новые матчи.
        if (!room) {
            await deleteMatch(ctx, match._id)
            
            return;
        }

        const players: Id<'users'>[] = [room.creatorId, room.opponentId]

        switch (args.stage) {
            case RPS_STAGES.WAITING: {
                await setStageAndScheduleNext(ctx, args.matchId, match.schedulerId, args.stage)

                break;
            }
            case RPS_STAGES.LOCK_IN: {
                const notReadyPlayers = players.filter(id => match.ready[id] !== true)
                
                // Проверяем что все готовы к началу матча. Если кто-то не готов - выкидываем из игры
                if (notReadyPlayers.length === 0) {
                    await setStageAndScheduleNext(ctx, args.matchId, match.schedulerId, args.stage)
                }

                for (let index = 0; index < notReadyPlayers.length; index++) {
                    await ctx.runMutation(internal.game.rcp.room.leaveByUserId, {userId: notReadyPlayers[index]})
                }
    
                break;
            }

            // ждём ход игрока с таймером.
            case RPS_STAGES.TURN_WAIT: {
                await setStageAndScheduleNext(ctx, args.matchId, match.schedulerId, args.stage)

                break;
            }

            case RPS_STAGES.TURN_SUBMIT: {
                // В этом шаге проверяем что ходы пользователей действительно есть. И лишь затем планируем переход к след. этапу
                const expiredTurnUsers = players.filter((id) => !match.turns[id])

                if (expiredTurnUsers.length === 0) {
                    await setStageAndScheduleNext(ctx, args.matchId, match.schedulerId, args.stage)
                } else {
                    for (let expiredTurnUserId of expiredTurnUsers) {
                        await ctx.runMutation(internal.game.rcp.room.leaveByUserId, {userId: expiredTurnUserId})
                    }
                }

                break;
            }

            case RPS_STAGES.TURN_RESOLVED: {
                await setStageAndScheduleNext(ctx, args.matchId, match.schedulerId, args.stage)

                const creatorId: Id<'users'> = room.creatorId;
                const opponentId: Id<'users'> = room.opponentId;
                const winnerId:Id<'users'> | null = resolveRPSWinner(match.turns);

                // Если есть победитель - надо перераспределить балансы пользователей.
                // Списываем заблокированные токены, а затем начисляем приз победителю.
                if (winnerId) {    
                    for (let playerId of players) {
                        await deductBlockedFunds(ctx, {
                            userId: playerId,
                            amount: room.betAmount,
                        })
                    }

                    await creditBalance(ctx, {
                        userId: winnerId,
                        amount: room.totalPot,
                    })
                }

                // Записываем историю игры для обоих пользователей
                [[creatorId, opponentId], [opponentId, creatorId]].map(async ([idA, idB]) => {
                    const user = await ctx.db.get('users', idB)

                    await ctx.db.insert(RPS_TABLES.HISTORY, {
                        userId: idA,
                        myTurn: match.turns[idA],
                        opponentAvatar: user?.telegramPhotoUrl,
                        opponentName: user?.name,
                        opponentTurn: match.turns[idB],
                        result: resolveMatchResult(match.turns, idA),
                        betAmount: room.betAmount,
                        totalPot: room.totalPot,
                    })
                })

                break;
            }

            case RPS_STAGES.LAUNCH_NEXT: {
                await setStageAndScheduleNext(ctx, args.matchId, match.schedulerId, args.stage)
                await deleteMatch(ctx, args.matchId)
                let hasPlayerLeft = false

                for (const playerId of players) {
                    try {
                        await lockBalance(ctx, {
                            userId: playerId,
                            amount: room.betAmount,
                        })
                    } catch (error) {
                        if (
                            error instanceof LockBalanceError &&
                            error.data.code === LockBalanceError.INSUFFICIENT_FUNDS
                        ) {
                            await ctx.runMutation(
                                internal.game.rcp.room.leaveByUserId,
                                { userId: playerId }
                            )
                            hasPlayerLeft = true

                            // выходим из цикла, оставшегося игрока не трогаем,
                            // т.е. матча и комнаты уже не должно быть
                            break 
                        }
                        throw error
                    }
                }

                if (!hasPlayerLeft) {
                    await createMatch(ctx, match.roomId)
                }

                break
            }

            default: {
                throw new Error('goToMatchStage: unknown state')
                break;
            }
        }
    }
})

/**
 * Метод для подтверждения что клиент готов к игре.
 * Во время стадии матча `RPS_STAGES.WAITING` ожидается что все игроки отправят
 * это событие для подтверждения старта матча. Без этого события матч будет
 * отменен, комната будет расформирована.
 */
export const submitReady = mutation({
    handler: async (ctx) => {
        const {userId} = await requireUser(ctx)
        const room = await ctx.runQuery(internal.game.rcp.room.getRoomByUser, {userId})

        if (!room) {
            return false
        }

        const match = await ctx.runQuery(internal.game.rcp.match.getMatchByRoomId, {roomId: room._id})

        if (!match || match.stage !== RPS_STAGES.WAITING || match.ready[userId]) {
            return false
        }

        const ready: Record<Id<'users'>, boolean> = {...match.ready, [userId]: true}

        await ctx.db.patch(RPS_TABLES.MATCHES, match._id, {ready})

        if (ready[room.creatorId] && ready[room.opponentId]) {
            await ctx.runMutation(internal.game.rcp.match.goToMatchStage, {matchId: match._id, stage: RPS_STAGES.LOCK_IN})
        }

        return true
    }
})

/**
 * Метод для того чтобы сделать ход. Во время стадии `RPS_STAGES.TURN_WAIT`
 * игроки должны сделать свои ходы. Ход возможно сделать только во время стадии
 * `RPS_STAGES.TURN_WAIT`. Ход можно сделать только один раз за матч. Если
 * игрок не сделает свой ход, то матч будет завершен, игроки не сделавшие свой
 * ход будут выкинуты в лобби (покинут комнаты и очереди игр)
 */
export const submitTurn = mutation({
    args: {
        turn: RPS_TURN_VALIDATOR
    },
    handler: async (ctx, args) => {
        const {userId} = await requireUser(ctx)
        const room = await ctx.runQuery(internal.game.rcp.room.getRoomByUser, {userId})

        if (!room) {
            return false
        }

        const match = await ctx.runQuery(internal.game.rcp.match.getMatchByRoomId, {roomId: room._id})

        if (!match || match.stage !== RPS_STAGES.TURN_WAIT || match.turns[userId]) {
            return false
        }

        const turns: Record<Id<'users'>, RpsTurn> = {...match.turns, [userId]: args.turn}

        await ctx.db.patch(RPS_TABLES.MATCHES, match._id, {turns})

        if (turns[room.creatorId] && turns[room.opponentId]) {
            await ctx.runMutation(internal.game.rcp.match.goToMatchStage, {matchId: match._id, stage: RPS_STAGES.TURN_SUBMIT})
        }
    }
})

/**
 * Данные для отображения хода матча на клиенте.
 */
export const get = query({
    handler: async (ctx) => {
        const {userId} = await requireUser(ctx)
        const room = await ctx.runQuery(internal.game.rcp.room.getRoomByUser, {userId})

        if (!room) {
            return null
        }

        const roomId: Id<'rps_rooms'> = room._id
        const match = await ctx.db.query(RPS_TABLES.MATCHES).withIndex('by_roomId', (q) => q.eq('roomId', roomId)).unique()

        if (!match) {
            return null
        }

        const opponentId: Id<'users'> = (room.opponentId === userId ? room.creatorId : room.opponentId) as Id<'users'>;
        const myTurn: RpsTurn = match.turns[userId];
        const opponentTurn: RpsTurn = match.turns[opponentId];
        const myReady = match.ready[userId] || false;
        const theirReady = match.ready[opponentId] || false;
        const stageTimeLeftSeconds = getStageTimeLeftSeconds(match.stage, match.stageTime)
    
        switch (match.stage) {
            case RPS_STAGES.TURN_WAIT:
            case RPS_STAGES.TURN_SUBMIT: {
                return {
                    id: match._id,
                    stage: match.stage,
                    stageTimeLeftSeconds,
                    myTurn,
                    opponentTurn,
                    myReady,
                    theirReady,
                    result: null,
                }
            }

            case RPS_STAGES.WAITING: {
                return {
                    id: match._id,
                    stage: match.stage,
                    stageTimeLeftSeconds,
                    myTurn,
                    opponentTurn,
                    myReady,
                    theirReady,
                    result: null,
                }
            }

            case RPS_STAGES.TURN_RESOLVED: {
                const result = resolveMatchResult(match.turns, userId)

                return {
                    id: match._id,
                    stage: match.stage,
                    stageTimeLeftSeconds,
                    myTurn,
                    opponentTurn,
                    myReady,
                    theirReady,
                    result,
                }
            }
                
            default: {
                return {
                    id: match._id,
                    stage: match.stage,
                    stageTimeLeftSeconds,
                    myTurn,
                    myReady,
                    theirReady,
                }
            }
        }
    }
})
