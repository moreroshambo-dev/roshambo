import { ConvexError } from "convex/values"
import { Id } from "../../../_generated/dataModel"
import { MutationCtx, QueryCtx } from "../../../_generated/server"
import { BalanceCurrency, lockBalance, unlockBalance } from "../../../libs/balances"
import { RPS_TABLES } from "./rps"

export const getOpponentFromQueue = async (ctx: MutationCtx, userId: Id<'users'>, amount: number, currency: BalanceCurrency) => {
  const queue = await ctx.db
    .query(RPS_TABLES.QUEUE)
    .withIndex('by_betAmount_currency', (q) => q.eq('betAmount', amount).eq('currency', currency))
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
  await unlockBalance(ctx, userId, queue.betAmount, queue.currency)

  return true
}

export const joinToQueue = async (ctx: MutationCtx, userId: Id<'users'>, amount: number, currency: BalanceCurrency) => {
  const queue = await getQueueByUserId(ctx, userId)

  if (queue) {
    throw new ConvexError('Уже есть в очереди')
  }
  
  await ctx.db.insert(RPS_TABLES.QUEUE, {
    userId,
    betAmount: amount,
    currency
  })

  await lockBalance(ctx, {
    userId,
    amount,
    currency
  })
}
