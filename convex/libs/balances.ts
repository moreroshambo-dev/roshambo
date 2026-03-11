import { ConvexError, v } from "convex/values";
import { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export const CURRENCY_RPS = "rps" as const;
/** In-game balance currency codes */
export const CURRENCY_VALIDATOR = v.literal(CURRENCY_RPS);

export type BalanceCurrency = typeof CURRENCY_RPS;

type BalanceDoc = {
  _id: Id<"balances">;
  _creationTime: number;
  userId: Id<"users">;
  currency: BalanceCurrency;
  available: number;
  locked: number;
};

export type BalanceSnapshot = {
  currency: BalanceCurrency;
  available: number;
  locked: number;
}

export const fetchBalance = async (ctx: QueryCtx | MutationCtx, userId: Id<"users">, currency: BalanceCurrency) => {
  const balance = await  ctx.db
    .query("balances")
    .withIndex("by_user_currency", (q) => q.eq("userId", userId).eq("currency", currency))
    .unique();

  return balance
}

export async function ensureBalance(
  ctx: MutationCtx,
  userId: Id<"users">,
  currency: BalanceCurrency,
): Promise<BalanceDoc> {
  const existing = await fetchBalance(ctx, userId, currency);
  if (existing) return existing;

  const id = await ctx.db.insert("balances", {
    userId,
    currency,
    available: 0,
    locked: 0,
  });
  const created = await ctx.db.get(id);
  if (!created) {
    throw new ConvexError({ code: "BALANCE_CREATE_FAILED", message: "Не удалось создать баланс" });
  }
  return created;
}

export async function getBalanceSnapshot(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  currency: BalanceCurrency,
): Promise<BalanceSnapshot> {
  const balance = await fetchBalance(ctx, userId, currency);
  if (balance) {
    return {
      currency: balance.currency,
      available: balance.available,
      locked: balance.locked,
    }
  }

  return {
    currency,
    available: 0,
    locked: 0,
  };
}

export class LockBalanceError extends ConvexError<{code: string, message: string}> {
  static INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS'
}
export type LockBalancePayload = {
  userId: Id<'users'>,
  currency: BalanceCurrency,
  amount: number,
}
export async function lockBalance(
  ctx: MutationCtx,
  payload: LockBalancePayload
): Promise<BalanceSnapshot> {
  if (payload.amount <= 0) {
    throw new LockBalanceError({ code: "BAD_REQUEST", message: "Сумма должна быть больше нуля" });
  }
  const balance = await ensureBalance(ctx, payload.userId, payload.currency);
  
  if (balance.locked > 0) {
    throw new LockBalanceError({ code: "BAD_REQUEST", message: "Сумма уже заблокирована" });
  }

  if (balance.available < payload.amount) {
    throw new LockBalanceError({ code: LockBalanceError.INSUFFICIENT_FUNDS, message: "Недостаточно средств на балансе" });
  }

  const newAvailable = balance.available - payload.amount
  const newLocked = balance.locked + payload.amount

  await ctx.db.patch(balance._id, {
    available: newAvailable,
    locked: newLocked,
  });

  return {
    currency: payload.currency,
    available: newAvailable,
    locked: newLocked,
  };
}

export async function unlockBalance(
  ctx: MutationCtx,
  userId: Id<"users">,
  amount: number,
  currency: BalanceCurrency,
): Promise<BalanceSnapshot> {
  if (amount <= 0) {
    throw new ConvexError({ code: "BAD_REQUEST", message: "Сумма должна быть больше нуля" });
  }

  const balance = await ensureBalance(ctx, userId, currency);
  const unlockAmount = Math.min(amount, balance.locked);
  const newBalance = balance.available + unlockAmount;
  const newLocked =balance.locked - unlockAmount;

  await ctx.db.patch(balance._id, {
    available: newBalance,
    locked: newLocked,
  });

  return {
    currency,
    available: newBalance,
    locked: newLocked,
  };
}

const BALANCES_TABLE = 'balances'

type CreateBalancePayload = {
    userId: Id<'users'>,
    currency: BalanceCurrency,
    amount: number,
}
const createBalance = async (ctx: MutationCtx, payload: CreateBalancePayload) => {
    const id = await ctx.db.insert("balances", {
        userId: payload.userId,
        currency: payload.currency,
        available: payload.amount,
        locked: 0,
    });

    return id
}

export type CreditBalancePayload = {
  userId: Id<'users'>,
  currency: BalanceCurrency,
  amount: number,
}
export async function creditBalance(ctx: MutationCtx, payload: CreditBalancePayload) {
  if (payload.amount <= 0) {
    throw new ConvexError({ code: "BAD_REQUEST", message: "Сумма должна быть больше нуля" });
  }

  const balance = await fetchBalance(ctx, payload.userId, payload.currency)

  if (balance) {
      await ctx.db.patch(BALANCES_TABLE, balance._id, {available: balance.available + payload.amount})
  } else {
    await createBalance(ctx, {
        userId: payload.userId,
        amount: payload.amount,
        currency: payload.currency,
    })
  }
}

type ResolvedType<T> = T extends Promise<infer U> ? U : never;

type DeductBlockedFundsPayload = {
  userId: Id<'users'>,
  currency: BalanceCurrency,
  amount: number,
}
export class DeductBlockedFundsError  extends ConvexError<{
  code: string,
  message: string,
  payload: DeductBlockedFundsPayload
  balance?: ResolvedType<ReturnType<typeof fetchBalance>>
}> {} 
export const deductBlockedFunds = async (ctx: MutationCtx, payload: DeductBlockedFundsPayload) => {
  const balance = await fetchBalance(ctx, payload.userId, payload.currency)

  if (!balance) {
    throw new DeductBlockedFundsError({
      code: "BALANCE_PROCESS_FAILED",
      message: "Не списать заблокированный баланс",
      payload,
      balance,
    });
  }

  if (balance.locked !== payload.amount) {
    balance
    throw new DeductBlockedFundsError({
      code: "INSUFFICIENT_FUNDS",
      message:
      'Не совпала сумма заблока и списания',
      payload,
      balance,
    });
  }

  await ctx.db.patch(BALANCES_TABLE, balance._id, {locked: 0})
}
