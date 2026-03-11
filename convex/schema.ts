import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { RPS_RESULT_VALIDATOR, RPS_STAGES_VALIDATOR, RPS_TABLES, RPS_TURN_VALIDATOR } from "./game/rcp/libs/rps";
import { CURRENCY_VALIDATOR } from "./libs/balances";

/** Supported token types for deposits */
const tokenTypeValidator = v.union(
  v.literal("TON"),
  v.literal("USDT"),
  v.literal("NOT"),
  v.literal("DOGS"),
);

/** Deposit transaction statuses */
const depositStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("failed"),
  v.literal("pending_review"),
);



export default defineSchema({
  ...authTables,
  users: defineTable({
    // Telegram Mini App identification
    telegramId: v.optional(v.number()),
    telegramFirstName: v.optional(v.string()),
    telegramLastName:  v.optional(v.string()),
    telegramUsername: v.optional(v.string()),
    telegramPhotoUrl: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    totalWins: v.optional(v.number()),
    totalLosses: v.optional(v.number()),
    totalDraws: v.optional(v.number()),
    // Daily multiplier tracking
    dailyStartBalance: v.optional(v.number()),
    dailyStartDate: v.optional(v.string()),
    // TON wallet
    walletAddress: v.optional(v.string()),
  }).index('by_telegramId', ['telegramId']),

  balances: defineTable({
    userId: v.id("users"),
    currency: CURRENCY_VALIDATOR,
    /** Spendable amount */
    available: v.number(),
    /** Locked for active games */
    locked: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_currency", ["userId", "currency"])
    .index("by_currency", ["currency"]),

  matches: defineTable({
    creatorId: v.id("users"),
    opponentId: v.optional(v.id("users")),
    betAmount: v.number(),
    status: v.union(
      v.literal("waiting"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    roomId: v.optional(v.id("rooms")),
    creatorChoice: v.optional(
      v.union(v.literal("rock"), v.literal("paper"), v.literal("scissors")),
    ),
    opponentChoice: v.optional(
      v.union(v.literal("rock"), v.literal("paper"), v.literal("scissors")),
    ),
    winnerId: v.optional(v.id("users")),
    result: v.optional(
      v.union(
        v.literal("creator_win"),
        v.literal("opponent_win"),
        v.literal("draw"),
      ),
    ),
    // Auto-rematch: each player signals "ready", then nextMatchId is created
    creatorRematchReady: v.optional(v.boolean()),
    opponentRematchReady: v.optional(v.boolean()),
    nextMatchId: v.optional(v.id("matches")),
    // Change-opponent: each player gets a separate waiting match
    splitCreatorMatchId: v.optional(v.id("matches")),
    splitOpponentMatchId: v.optional(v.id("matches")),
  })
    .index("by_status", ["status"])
    .index("by_creator", ["creatorId"])
    .index("by_opponent", ["opponentId"]),

  /** WebRTC signaling messages for in-match voice chat */
  signals: defineTable({
    roomId: v.id(RPS_TABLES.ROOMS),
    fromUserId: v.id("users"),
    type: v.union(
      v.literal("offer"),
      v.literal("answer"),
      v.literal("ice-candidate"),
      v.literal("voice-invite"),
      v.literal("voice-decline"),
    ),
    /** JSON-stringified SDP or ICE candidate (empty for voice-invite/decline) */
    payload: v.string(),
  }).index("by_room", ["roomId"]),

  [RPS_TABLES.HISTORY]: defineTable({
    userId: v.id('users'),
    opponentAvatar: v.optional(v.string()),
    opponentName: v.optional(v.string()),
    result: RPS_RESULT_VALIDATOR,
    betAmount: v.number(),
    totalPot: v.number(),
    myTurn: RPS_TURN_VALIDATOR,
    opponentTurn: RPS_TURN_VALIDATOR,
  })
    .index('by_userId', ['userId']),

  deposits: defineTable({
    userId: v.id("users"),
    walletAddress: v.string(),
    tokenType: tokenTypeValidator,
    /** Amount in smallest unit (nanoton for TON) */
    rawAmount: v.string(),
    /** Human-readable display amount */
    displayAmount: v.number(),
    /** Tokens credited to the game balance */
    creditedTokens: v.number(),
    /** System deposit address the user sends to */
    depositAddress: v.string(),
    /** Blockchain transaction hash (mock-generated during dev) */
    txHash: v.string(),
    /** Current deposit status */
    status: depositStatusValidator,
    /** Where the event came from: "mock_blockchain" | "ton_mainnet" */
    source: v.string(),
    /** ISO 8601 UTC timestamp when deposit was initiated */
    initiatedAt: v.string(),
    /** ISO 8601 UTC timestamp when deposit was confirmed/failed */
    resolvedAt: v.optional(v.string()),
    /** Anti-fraud flags (empty = clean) */
    antifraudFlags: v.optional(v.array(v.string())),
  })
    .index("by_userId", ["userId"])
    .index("by_txHash", ["txHash"])
    .index("by_status", ["status"]),

  [RPS_TABLES.QUEUE]: defineTable({
    userId: v.id('users'),
    betAmount: v.number(),
    currency: CURRENCY_VALIDATOR,
  })
    .index("by_betAmount_currency", ["betAmount", 'currency'])
    .index("by_userId", ["userId"]),

  [RPS_TABLES.ROOMS]: defineTable({
    creatorId: v.id('users'),
    opponentId: v.id('users'),
    betAmount: v.number(),
    totalPot: v.number(),
    currency: CURRENCY_VALIDATOR,
  })
    .index("by_creator", ["creatorId"])
    .index("by_opponent", ["opponentId"]),
  rps_user_state: defineTable({
    userId: v.id("users"),
    roomId: v.optional(v.id("rooms")),
    autoSelectEnabled: v.boolean(),
  })
    .index("by_userId", ["userId"]),

  [RPS_TABLES.MATCHES]: defineTable({
    roomId: v.id(RPS_TABLES.ROOMS),
    schedulerId: v.optional(v.id('_scheduled_functions')),
    stage: RPS_STAGES_VALIDATOR,
    turns: v.record(v.id('users'), RPS_TURN_VALIDATOR),
    ready: v.record(v.id('users'), v.boolean()),
    stageTime: v.number(),
  })
    .index("by_roomId", ["roomId"]),

  [RPS_TABLES.SETTINGS]: defineTable({
    userId: v.id("users"),
    autoSelectEnabled: v.boolean(),
    autoSelectDuration: v.number(),
  })
    .index("by_userId", ["userId"]),
});
