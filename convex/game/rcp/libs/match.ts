import { ConvexError } from "convex/values"
import { internal } from "../../../_generated/api"
import type { Id } from "../../../_generated/dataModel"
import type { MutationCtx } from "../../../_generated/server"
import { RPS_STAGES, RPS_STAGES_OPTIONS, RPS_TABLES, type RpsStage } from "./rps"
import { getBalanceSnapshot } from "../../../libs/balances"

/**
 * Внутренний метод для удаления матчей. Удаляет матч и очищает запланированные
 * задачи.
 */
export const deleteMatch = async (ctx: MutationCtx, matchId: Id<typeof RPS_TABLES.MATCHES>) => {
  const match = await ctx.db.get(RPS_TABLES.MATCHES, matchId)

  if (!match) {
    return
  }

  if (match.schedulerId) {
    await ctx.scheduler.cancel(match.schedulerId)
  }

  await ctx.db.delete(RPS_TABLES.MATCHES, match._id)
}


export class CreateMatchError extends ConvexError<{
  code: string,
  message: string
}> {} 
/**
 * Внутренний метод для создания матча в рамках комнаты. Перед созданием матча
 * проверяет есть ли ранее созданные матч в комнате. Если такой матч есть, то 
 * метод ничего не делает и просто возвращает id существующего матча. Если
 * ранее созданный матч не найден, то:
 * - создает матч в рамках существующей комнаты
 * - Проверяет заблокированные балансы.
 *   - Если заблокированный баланс не равен размеру ставки, то выкидывает
 *     пользователя из комнаты и матча
 */
export const createMatch = async (ctx: MutationCtx, roomId: Id<typeof RPS_TABLES.ROOMS>) => {
    const match = await getMatchByRoomId(ctx, roomId)

    if (match) {
      const matchId: Id<typeof RPS_TABLES.MATCHES> = match._id

      return matchId
    }

    const room = await ctx.db.get(RPS_TABLES.ROOMS, roomId)

    if (!room) {
      throw new CreateMatchError({code: 'ROOM_NOT_FOUND', message: 'Попытка создания матча для несуществующей комнаты'})
    }

    const matchId = await ctx.db.insert(RPS_TABLES.MATCHES, {
      roomId,
      stage: 'waiting',
      turns: {},
      ready: {},
      stageTime: 0,
    })

    const players: Id<'users'>[] = [room.creatorId, room.opponentId]

    for (const userId of players) {
      const balance = await getBalanceSnapshot(ctx, userId)
      
      if (balance.locked !== room.betAmount) {
        await ctx.runMutation(internal.game.rcp.room.leaveByUserId, {userId})
      }
    }

    await ctx.runMutation(internal.game.rcp.match.goToMatchStage, {matchId, stage: RPS_STAGES.WAITING})

    return matchId
}

export const getMatchByRoomId = async (ctx: MutationCtx, roomId: Id<typeof RPS_TABLES.ROOMS>) => {
  const match = await ctx.db.query(RPS_TABLES.MATCHES).withIndex('by_roomId', (q) => q.eq('roomId', roomId)).unique()

  return match    
}

export const setStageAndScheduleNext = async (
  ctx: MutationCtx,
  matchId: Id<'rps_matches'>,
  oldSchedulerId: Id<"_scheduled_functions"> | undefined,
  currentStage: RpsStage,
) => {
  let newSchedulerId: Id<"_scheduled_functions"> | undefined

  const currentStageOptions = RPS_STAGES_OPTIONS[currentStage]

  if (currentStageOptions.duration && currentStageOptions.nextStage) {
    newSchedulerId = await ctx.scheduler.runAfter(
      currentStageOptions.duration,
      internal.game.rcp.match.goToMatchStage,
      {matchId, stage: currentStageOptions.nextStage}
    )
  }
  
  await ctx.db.patch(RPS_TABLES.MATCHES, matchId, {
    schedulerId: newSchedulerId,
    stage: currentStage,
    stageTime: Date.now()
  })

  if (oldSchedulerId) {
    await ctx.scheduler.cancel(oldSchedulerId)
  }
}