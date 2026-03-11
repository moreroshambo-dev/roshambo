import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const STARTING_TOKENS = 1000;

/** Helper: find a user by their telegramId (filter scan – table is small) */
async function findByTelegramId(ctx: QueryCtx | MutationCtx, telegramId: string) {
  const users = await ctx.db.query("users").collect();
  return users.find((u) => u.telegramId === telegramId) ?? null;
}

/** Legacy mutation kept for auth callback compatibility */
export const updateCurrentUser = mutation({
  args: {},
  handler: async () => {
    // No-op: user creation is handled via Telegram provider
    return null;
  },
});

/** Get or create a user by their Telegram ID */
export const getOrCreateUser = mutation({
  args: {
    telegramId: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await findByTelegramId(ctx, args.telegramId);

    if (existing) {
      // Update name if changed
      if (args.name && args.name !== existing.name) {
        await ctx.db.patch(existing._id, { name: args.name });
      }
      // Backfill token fields if missing
      if (existing.tokenBalance === undefined) {
        await ctx.db.patch(existing._id, {
          tokenBalance: STARTING_TOKENS,
          totalWins: 0,
          totalLosses: 0,
          totalDraws: 0,
        });
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      telegramId: args.telegramId,
      name: args.name,
      tokenBalance: STARTING_TOKENS,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
    });
  },
});

/** Get current user by Telegram ID */
export const getCurrentUser = query({
  args: { telegramId: v.string() },
  handler: async (ctx, args) => {
    const user = await findByTelegramId(ctx, args.telegramId);

    if (!user) return null;

    return {
      ...user,
      tokenBalance: user.tokenBalance ?? STARTING_TOKENS,
      totalWins: user.totalWins ?? 0,
      totalLosses: user.totalLosses ?? 0,
      totalDraws: user.totalDraws ?? 0,
      walletAddress: user.walletAddress ?? null,
    };
  },
});

/** Link a TON wallet address to the current user */
export const linkWallet = mutation({
  args: {
    telegramId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await findByTelegramId(ctx, args.telegramId);
    if (!user) {
      throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
    }
    await ctx.db.patch(user._id, { walletAddress: args.walletAddress });
    return user._id;
  },
});

/** Unlink the TON wallet from the current user */
export const unlinkWallet = mutation({
  args: { telegramId: v.string() },
  handler: async (ctx, args) => {
    const user = await findByTelegramId(ctx, args.telegramId);
    if (!user) {
      throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
    }
    await ctx.db.patch(user._id, { walletAddress: undefined });
    return user._id;
  },
});
