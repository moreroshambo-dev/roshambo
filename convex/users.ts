import { v, ConvexError } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getUser, requireUser } from "./libs/auth.ts";
import { getBalanceSnapshot } from "./libs/balances";

/** Legacy mutation kept for auth callback compatibility */
export const updateCurrentUser = mutation({
  args: {},
  handler: async () => {
    // No-op: user creation is handled via Telegram provider
    return null;
  },
});

/** Get or create a user by their Telegram ID */
export const getByTelegramOrCreateUser = internalMutation({
  args: {
    telegramId: v.optional(v.number()),
    telegramFirstName: v.optional(v.string()),
    telegramLastName:  v.optional(v.string()),
    telegramUsername: v.optional(v.string()),
    telegramPhotoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").withIndex('by_telegramId', (q) => q.eq('telegramId', args.telegramId)).unique()

    if (existing) {
      // Update name if changed
      await ctx.db.patch(existing._id, args);

      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      ...args,
      name: [args.telegramFirstName, args.telegramLastName].filter(item => item).join(' '),
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
    });
  
    return userId;
  },
});

export const getBalance = query({
  handler: async (ctx) => {
    const {userId} = await requireUser(ctx)
    const balance = await getBalanceSnapshot(ctx, userId);

    return {
      available: balance.available,
      locked: balance.locked,
    }
  }
})

/** Get current user by Telegram ID */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const user = await getUser(ctx);

    if (!user) return null;


    return {
      ...user,
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
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) {
      throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
    }
    await ctx.db.patch(user._id, { walletAddress: args.walletAddress });
    return user._id;
  },
});

/** Unlink the TON wallet from the current user */
export const unlinkWallet = mutation({
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) {
      throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
    }
    await ctx.db.patch(user._id, { walletAddress: undefined });
    return user._id;
  },
});
