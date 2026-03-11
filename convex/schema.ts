import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
  users: defineTable({
    // Telegram Mini App identification
    telegramId: v.optional(v.string()),
    // Legacy Hercules Auth identifier (kept for backward compat)
    tokenIdentifier: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    tokenBalance: v.optional(v.number()),
    totalWins: v.optional(v.number()),
    totalLosses: v.optional(v.number()),
    totalDraws: v.optional(v.number()),
    // Daily multiplier tracking
    dailyStartBalance: v.optional(v.number()),
    dailyStartDate: v.optional(v.string()),
    // TON wallet
    walletAddress: v.optional(v.string()),
  }),

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
    matchId: v.id("matches"),
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
  }).index("by_match", ["matchId"]),

  deposits: defineTable({
    userId: v.id("users"),
    telegramId: v.string(),
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
    .index("by_status", ["status"])
    .index("by_telegramId", ["telegramId"]),
});
