import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUser } from "./libs/auth";
import { RPS_TABLES } from "./game/rcp/libs/rps";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/** Send a WebRTC signaling message (offer, answer, or ICE candidate) */
export const sendSignal = mutation({
  args: {
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
    const user = await getUser(ctx);
    const room = await ctx.runQuery(internal.game.rcp.room.getRoomByUser, {userId: user._id})

    if (!room) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Room not found" });
    }

    await ctx.db.insert("signals", {
      roomId: room._id,
      fromUserId: user._id,
      type: args.type,
      payload: args.payload,
    });
  },
});

/** Get signaling messages for a match (excludes messages from the requester) */
export const getSignals = query({
  handler: async (ctx) => {
    const user = await getUser(ctx);
    const room = await ctx.runQuery(internal.game.rcp.room.getRoomByUser, {userId: user._id})

    if (!room) {
      return [];
    }

    const roomId: Id<typeof RPS_TABLES.ROOMS> = room._id

    const signals = await ctx.db
      .query("signals")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();

    // Return only signals from the other player
    return signals.filter((s) => s.fromUserId !== user._id);
  },
});

/** Clean up all signaling messages for a match */
export const clearSignals = mutation({
  handler: async (ctx) => {
    // Verify user exists
    const user = await getUser(ctx);
    const room = await ctx.runQuery(internal.game.rcp.room.getRoomByUser, {userId: user._id})

    if (!room) {
      return;
    }

    const roomId: Id<typeof RPS_TABLES.ROOMS> = room._id

    const signals = await ctx.db
      .query("signals")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();

    for (const signal of signals) {
      await ctx.db.delete(signal._id);
    }
  },
});
