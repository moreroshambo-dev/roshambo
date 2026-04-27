import { type Infer, v } from "convex/values";
import type { Id } from "../../../_generated/dataModel";

export const RPS_TABLES = Object.freeze({
  ROOMS: 'rps_rooms',
  MATCHES: 'rps_matches',
  SETTINGS: 'rps_settings',
  HISTORY: 'rps_history',
  QUEUE: 'rps_queue',
})

export const RPS_TURNS_VARIANTS = Object.freeze({
  ROCK: '🪨',
  PAPER: '📄',
  SCISSORS: '✂️',
})
export const RPS_TURN_VALIDATOR = v.union(...Object.values(RPS_TURNS_VARIANTS).map((value) => v.literal(value)));
export type RpsTurn = Infer<typeof RPS_TURN_VALIDATOR>

export const RPS_STAGES = Object.freeze({
  WAITING: 'waiting',
  LOCK_IN: 'lock-in',
  TURN_WAIT: 'turn_wait',
  TURN_SUBMIT: 'turn_submitted',
  TURN_RESOLVED: 'turn_resolved',
  /** Этап матча при котором удаляется матч и начинается новый */
  LAUNCH_NEXT: 'launch_next',
})
export const RPS_STAGES_VALIDATOR = v.union(...Object.values(RPS_STAGES).map((value) => v.literal(value)));
export type RpsStage = Infer<typeof RPS_STAGES_VALIDATOR>

export const RPS_RESULT = Object.freeze({
  DRAW: '🤝',
  WIN: '👍',
  LOSE: '👎'
})
export const RPS_RESULT_VALIDATOR = v.union(...Object.values(RPS_RESULT).map((value) => v.literal(value)));
export type RpsResult = Infer<typeof RPS_RESULT_VALIDATOR>


export const resolveRPSWinner = (turns: Record<Id<'users'>, RpsTurn>): Id<'users'> | null => {
  const [[userA, turnA], [userB, turnB]] = Object.entries(turns)
  
  if (turnA === turnB) {
    return null;
  }

  if (
    (turnA === RPS_TURNS_VARIANTS.ROCK && turnB === RPS_TURNS_VARIANTS.SCISSORS) ||
    (turnA === RPS_TURNS_VARIANTS.PAPER && turnB === RPS_TURNS_VARIANTS.ROCK) ||
    (turnA === RPS_TURNS_VARIANTS.SCISSORS && turnB === RPS_TURNS_VARIANTS.PAPER)
  ) {
    return userA as Id<'users'>
  }

  return userB as Id<'users'>
}

export const resolveMatchResult = (turns: Record<Id<'users'>, RpsTurn>, userId: Id<'users'>): RpsResult => {
  const winnerId = resolveRPSWinner(turns)

  if (winnerId === null) {
    return RPS_RESULT.DRAW
  }

  if (winnerId === userId) {
    return RPS_RESULT.WIN
  }

  return RPS_RESULT.LOSE
}



export const RPS_STAGES_OPTIONS = Object.freeze({
  [RPS_STAGES.WAITING]: {
    duration: 3_000,
    nextStage: RPS_STAGES.LOCK_IN,
  },
  [RPS_STAGES.LOCK_IN]: {
    duration: 1_000,
    nextStage: RPS_STAGES.TURN_WAIT,
  },
  [RPS_STAGES.TURN_WAIT]: {
    duration: 30_000,
    nextStage: RPS_STAGES.TURN_SUBMIT,
  },
  [RPS_STAGES.TURN_SUBMIT]: {
    duration: 1_000,
    nextStage: RPS_STAGES.TURN_RESOLVED,
  },
  [RPS_STAGES.TURN_RESOLVED]: {
    duration: 5_000,
    nextStage: RPS_STAGES.LAUNCH_NEXT,
  },
  [RPS_STAGES.LAUNCH_NEXT]: {
    duration: 0,
    nextStage: undefined,
  }
})

// Persist current stage, schedule the next one (if provided), and clean up the previous timer.


export const getStageTimeLeftSeconds = (stage: RpsStage, stageTime: number) => {
  return Math.max(
    Math.floor((RPS_STAGES_OPTIONS[stage].duration - (Date.now() - stageTime)) / 1000),
    0,
  )
}