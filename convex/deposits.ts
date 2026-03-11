import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// ─── Constants ───────────────────────────────────────────────────────────────

/** System deposit address (mock – replace with real vault address in production) */
const SYSTEM_DEPOSIT_ADDRESS = "EQDMockSystemVaultAddress000000000000000000000000";

/** Conversion rates: 1 unit of token → game tokens */
const TOKEN_RATES: Record<string, number> = {
  TON: 500,   // 1 TON = 500 game tokens
  USDT: 100,  // 1 USDT = 100 game tokens
  NOT: 10,    // 1 NOT = 10 game tokens
  DOGS: 5,    // 1 DOGS = 5 game tokens
};

/** Minimum deposit amounts (in display units) */
const MIN_DEPOSIT: Record<string, number> = {
  TON: 0.1,
  USDT: 1,
  NOT: 10,
  DOGS: 100,
};

/** Allowed token types (for validation) */
const ALLOWED_TOKENS = new Set(["TON", "USDT", "NOT", "DOGS"]);

/** Anti-fraud: max deposits per user in a 1-hour window */
const MAX_DEPOSITS_PER_HOUR = 10;

/** Mock confirmation delay range in ms (3–8 seconds) */
const MOCK_MIN_DELAY_MS = 3000;
const MOCK_MAX_DELAY_MS = 8000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function findUserByTelegramId(ctx: QueryCtx | MutationCtx, telegramId: string) {
  const users = await ctx.db.query("users").collect();
  return users.find((u) => u.telegramId === telegramId) ?? null;
}

/** Generate a mock tx hash that looks realistic */
function generateMockTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/** Convert display amount to raw (smallest unit) string */
function toRawAmount(displayAmount: number, tokenType: string): string {
  const decimals: Record<string, number> = {
    TON: 9,    // 1 TON = 10^9 nanoton
    USDT: 6,   // 1 USDT = 10^6
    NOT: 9,
    DOGS: 9,
  };
  const d = decimals[tokenType] ?? 9;
  return Math.round(displayAmount * Math.pow(10, d)).toString();
}

// ─── Anti-Fraud Module ───────────────────────────────────────────────────────

type AntifraudResult = {
  pass: boolean;
  flags: string[];
};

async function runAntifraudChecks(
  ctx: MutationCtx,
  params: {
    userId: string;
    txHash: string;
    tokenType: string;
    displayAmount: number;
    walletAddress: string;
  },
): Promise<AntifraudResult> {
  const flags: string[] = [];

  // 1. Check txHash uniqueness
  const existingTx = await ctx.db
    .query("deposits")
    .withIndex("by_txHash", (q) => q.eq("txHash", params.txHash))
    .first();
  if (existingTx) {
    flags.push("DUPLICATE_TX_HASH");
  }

  // 2. Check minimum deposit
  const minAmount = MIN_DEPOSIT[params.tokenType] ?? 0.1;
  if (params.displayAmount < minAmount) {
    flags.push("BELOW_MINIMUM_AMOUNT");
  }

  // 3. Check allowed token
  if (!ALLOWED_TOKENS.has(params.tokenType)) {
    flags.push("UNSUPPORTED_TOKEN");
  }

  // 4. Rate limiting – max deposits per hour
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
  const recentDeposits = await ctx.db
    .query("deposits")
    .withIndex("by_userId")
    .collect();
  const userRecentCount = recentDeposits.filter(
    (d) => d.userId === params.userId && d.initiatedAt > oneHourAgo,
  ).length;
  if (userRecentCount >= MAX_DEPOSITS_PER_HOUR) {
    flags.push("RATE_LIMIT_EXCEEDED");
  }

  // 5. Suspiciously large deposit (over 1000 TON equivalent)
  const rate = TOKEN_RATES[params.tokenType] ?? 100;
  const tokenEquivalent = params.displayAmount * rate;
  if (tokenEquivalent > 500_000) {
    flags.push("SUSPICIOUS_LARGE_AMOUNT");
  }

  const hardBlockFlags = new Set(["DUPLICATE_TX_HASH", "UNSUPPORTED_TOKEN"]);
  const isHardBlocked = flags.some((f) => hardBlockFlags.has(f));

  return {
    pass: !isHardBlocked && flags.length === 0,
    flags,
  };
}

// ─── Mutations ───────────────────────────────────────────────────────────────

const tokenTypeArg = v.union(
  v.literal("TON"),
  v.literal("USDT"),
  v.literal("NOT"),
  v.literal("DOGS"),
);

/**
 * Initiate a new deposit.
 * Creates a pending deposit record and schedules a mock blockchain confirmation.
 */
export const initiateDeposit = mutation({
  args: {
    telegramId: v.string(),
    tokenType: tokenTypeArg,
    displayAmount: v.number(),
  },
  handler: async (ctx, args): Promise<{ depositId: string; depositAddress: string; txHash: string }> => {
    const user = await findUserByTelegramId(ctx, args.telegramId);
    if (!user) {
      throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
    }

    if (!user.walletAddress) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Connect your wallet first" });
    }

    // Validate token type
    if (!ALLOWED_TOKENS.has(args.tokenType)) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Unsupported token type" });
    }

    // Validate minimum deposit
    const minAmount = MIN_DEPOSIT[args.tokenType] ?? 0.1;
    if (args.displayAmount < minAmount) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: `Minimum deposit for ${args.tokenType} is ${minAmount}`,
      });
    }

    const txHash = generateMockTxHash();
    const rawAmount = toRawAmount(args.displayAmount, args.tokenType);
    const rate = TOKEN_RATES[args.tokenType] ?? 100;
    const creditedTokens = Math.floor(args.displayAmount * rate);
    const now = new Date().toISOString();

    // Run anti-fraud checks before creating the deposit
    const antifraud = await runAntifraudChecks(ctx, {
      userId: user._id,
      txHash,
      tokenType: args.tokenType,
      displayAmount: args.displayAmount,
      walletAddress: user.walletAddress,
    });

    // Determine initial status based on anti-fraud result
    const initialStatus = antifraud.pass
      ? ("pending" as const)
      : antifraud.flags.some((f) => f === "DUPLICATE_TX_HASH" || f === "UNSUPPORTED_TOKEN")
        ? ("failed" as const)
        : ("pending_review" as const);

    const depositId = await ctx.db.insert("deposits", {
      userId: user._id,
      telegramId: args.telegramId,
      walletAddress: user.walletAddress,
      tokenType: args.tokenType,
      rawAmount,
      displayAmount: args.displayAmount,
      creditedTokens,
      depositAddress: SYSTEM_DEPOSIT_ADDRESS,
      txHash,
      status: initialStatus,
      source: "mock_blockchain",
      initiatedAt: now,
      antifraudFlags: antifraud.flags.length > 0 ? antifraud.flags : undefined,
    });

    // Schedule mock blockchain confirmation (only for clean deposits)
    if (initialStatus === "pending") {
      const delay = MOCK_MIN_DELAY_MS + Math.random() * (MOCK_MAX_DELAY_MS - MOCK_MIN_DELAY_MS);
      await ctx.scheduler.runAfter(delay, internal.deposits.mockConfirmDeposit, {
        depositId,
      });
    }

    return {
      depositId,
      depositAddress: SYSTEM_DEPOSIT_ADDRESS,
      txHash,
    };
  },
});

/**
 * Internal mutation: mock blockchain confirms a pending deposit.
 * Simulates the indexer detecting the transaction on-chain.
 * ~90% success rate to simulate real blockchain behavior.
 */
export const mockConfirmDeposit = internalMutation({
  args: { depositId: v.id("deposits") },
  handler: async (ctx, args) => {
    const deposit = await ctx.db.get(args.depositId);
    if (!deposit) return;
    if (deposit.status !== "pending") return; // already processed

    // 90% success rate simulation
    const isSuccess = Math.random() < 0.9;
    const now = new Date().toISOString();

    if (isSuccess) {
      // Confirm the deposit and credit game tokens
      await ctx.db.patch(args.depositId, {
        status: "confirmed",
        resolvedAt: now,
      });

      // Credit user balance
      const user = await ctx.db.get(deposit.userId);
      if (user) {
        const currentBalance = user.tokenBalance ?? 1000;
        await ctx.db.patch(user._id, {
          tokenBalance: currentBalance + deposit.creditedTokens,
        });
      }
    } else {
      // Simulate a failed transaction
      await ctx.db.patch(args.depositId, {
        status: "failed",
        resolvedAt: now,
        antifraudFlags: [...(deposit.antifraudFlags ?? []), "MOCK_TX_FAILED"],
      });
    }
  },
});

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Get all deposits for the current user */
export const getMyDeposits = query({
  args: { telegramId: v.string() },
  handler: async (ctx, args) => {
    const deposits = await ctx.db
      .query("deposits")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .order("desc")
      .take(50);
    return deposits;
  },
});

/** Get a single deposit by ID */
export const getDeposit = query({
  args: { telegramId: v.string(), depositId: v.id("deposits") },
  handler: async (ctx, args) => {
    const deposit = await ctx.db.get(args.depositId);
    if (!deposit || deposit.telegramId !== args.telegramId) {
      return null;
    }
    return deposit;
  },
});

/** Get token info (rates, minimums) for the deposit form */
export const getTokenInfo = query({
  args: {},
  handler: async () => {
    return {
      tokens: [
        { symbol: "TON", name: "Toncoin", rate: TOKEN_RATES.TON, min: MIN_DEPOSIT.TON, decimals: 9 },
        { symbol: "USDT", name: "Tether USD", rate: TOKEN_RATES.USDT, min: MIN_DEPOSIT.USDT, decimals: 6 },
        { symbol: "NOT", name: "Notcoin", rate: TOKEN_RATES.NOT, min: MIN_DEPOSIT.NOT, decimals: 9 },
        { symbol: "DOGS", name: "Dogs", rate: TOKEN_RATES.DOGS, min: MIN_DEPOSIT.DOGS, decimals: 9 },
      ],
      depositAddress: SYSTEM_DEPOSIT_ADDRESS,
    };
  },
});
