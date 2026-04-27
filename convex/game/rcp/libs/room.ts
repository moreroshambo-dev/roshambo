import { ConvexError } from "convex/values"
import type { Id } from "../../../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../../../_generated/server"
import { lockBalance, unlockBalance } from "../../../libs/balances"
import { RPS_TABLES } from "./rps"

export const getOpponentFromQueue = async (ctx: MutationCtx, userId: Id<'users'>, amount: number) => {
  const queue = await ctx.db
    .query(RPS_TABLES.QUEUE)
    .withIndex('by_betAmount', (q) => q.eq('betAmount', amount))
    .order('asc')
    .filter((q) => q.neq(q.field('userId'), userId))
    .first()

  return queue
}

export const getQueueByUserId = async (ctx: MutationCtx | QueryCtx, userId: Id<'users'>) => {
  const queue = ctx.db.query(RPS_TABLES.QUEUE).withIndex('by_userId', (q) => q.eq('userId', userId)).unique()

  return queue
}

export const leaveQueue = async (ctx: MutationCtx, userId: Id<'users'>) => {
  const queue = await getQueueByUserId(ctx, userId)

  if (!queue) {
    return false
  }
  
  await ctx.db.delete(RPS_TABLES.QUEUE, queue._id)
  await unlockBalance(ctx, userId, queue.betAmount)

  return true
}

export const joinToQueue = async (ctx: MutationCtx, userId: Id<'users'>, amount: number) => {
  const queue = await getQueueByUserId(ctx, userId)

  if (queue) {
    throw new ConvexError('Уже есть в очереди')
  }
  
  await ctx.db.insert(RPS_TABLES.QUEUE, {
    userId,
    betAmount: amount,
  })

  await lockBalance(ctx, {
    userId,
    amount,
  })
}
