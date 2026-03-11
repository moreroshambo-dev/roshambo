import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/** Helper to find user by telegramId (filter scan – table is small) */
async function findUser(ctx: QueryCtx | MutationCtx, telegramId: string) {
  const users = await ctx.db.query("users").collect();
  const user = users.find((u) => u.telegramId === telegramId);
  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "User not found.",
    });
  }
  return user;
}

/** Send a WebRTC signaling message (offer, answer, or ICE candidate) */
export const sendSignal = mutation({
  args: {
    matchId: v.id("matches"),
    telegramId: v.string(),
    type: v.union(
      v.literal("offer"),
      v.literal("answer"),
      v.literal("ice-candidate"),
      v.literal("voice-invite"),
      v.literal("voice-decline"),
    ),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await findUser(ctx, args.telegramId);

    // Verify the user is a participant
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Match not found" });
    }
    if (match.creatorId !== user._id && match.opponentId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Not a participant",
      });
    }

    await ctx.db.insert("signals", {
      matchId: args.matchId,
      fromUserId: user._id,
      type: args.type,
      payload: args.payload,
    });
  },
});

/** Get signaling messages for a match (excludes messages from the requester) */
export const getSignals = query({
  args: {
    matchId: v.id("matches"),
    telegramId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await findUser(ctx, args.telegramId);

    const signals = await ctx.db
      .query("signals")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();

    // Return only signals from the other player
    return signals.filter((s) => s.fromUserId !== user._id);
  },
});

/** Clean up all signaling messages for a match */
export const clearSignals = mutation({
  args: {
    matchId: v.id("matches"),
    telegramId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    await findUser(ctx, args.telegramId);

    const signals = await ctx.db
      .query("signals")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .collect();

    for (const signal of signals) {
      await ctx.db.delete(signal._id);
    }
  },
});
