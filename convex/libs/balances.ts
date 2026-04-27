import { ConvexError, v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type BalanceDoc = {
  _id: Id<"balances">;
  _creationTime: number;
  userId: Id<"users">;
  available: number;
  locked: number;
};

export type BalanceSnapshot = {
  available: number;
  locked: number;
}

export const fetchBalance = async (ctx: QueryCtx | MutationCtx, userId: Id<"users">) => {
  const balance = await  ctx.db
    .query("balances")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  return balance
}

export async function ensureBalance(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<BalanceDoc> {
  const existing = await fetchBalance(ctx, userId);
  if (existing) return existing;

  const id = await ctx.db.insert("balances", {
    userId,
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
): Promise<BalanceSnapshot> {
  const balance = await fetchBalance(ctx, userId);
  if (balance) {
    return {
      available: balance.available,
      locked: balance.locked,
    }
  }

  return {
    available: 0,
    locked: 0,
  };
}

export class LockBalanceError extends ConvexError<{code: string, message: string}> {
  static INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS'
}
export type LockBalancePayload = {
  userId: Id<'users'>,
  amount: number,
}
export async function lockBalance(
  ctx: MutationCtx,
  payload: LockBalancePayload
): Promise<BalanceSnapshot> {
  if (payload.amount < 0) {
    throw new LockBalanceError({ code: "BAD_REQUEST", message: "Сумма должна быть больше нуля" });
  }
  const balance = await ensureBalance(ctx, payload.userId);
  
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
    available: newAvailable,
    locked: newLocked,
  };
}

export async function unlockBalance(
  ctx: MutationCtx,
  userId: Id<"users">,
  amount: number,
): Promise<BalanceSnapshot> {
  if (amount < 0) {
    throw new ConvexError({ code: "BAD_REQUEST", message: "Сумма должна быть больше нуля" });
  }

  const balance = await ensureBalance(ctx, userId);
  const unlockAmount = Math.min(amount, balance.locked);
  const newBalance = balance.available + unlockAmount;
  const newLocked =balance.locked - unlockAmount;

  await ctx.db.patch(balance._id, {
    available: newBalance,
    locked: newLocked,
  });

  return {
    available: newBalance,
    locked: newLocked,
  };
}

const BALANCES_TABLE = 'balances'

type CreateBalancePayload = {
    userId: Id<'users'>,
    amount: number,
}
const createBalance = async (ctx: MutationCtx, payload: CreateBalancePayload) => {
    const id = await ctx.db.insert("balances", {
        userId: payload.userId,
        available: payload.amount,
        locked: 0,
    });

    return id
}

export type CreditBalancePayload = {
  userId: Id<'users'>,
  amount: number,
}
export async function creditBalance(ctx: MutationCtx, payload: CreditBalancePayload) {
  if (payload.amount < 0) {
    throw new ConvexError({ code: "BAD_REQUEST", message: "Сумма должна быть больше нуля" });
  }

  const balance = await fetchBalance(ctx, payload.userId)

  if (balance) {
      await ctx.db.patch(BALANCES_TABLE, balance._id, {available: balance.available + payload.amount})
  } else {
    await createBalance(ctx, {
        userId: payload.userId,
        amount: payload.amount,
    })
  }
}

type ResolvedType<T> = T extends Promise<infer U> ? U : never;

type DeductBlockedFundsPayload = {
  userId: Id<'users'>,
  amount: number,
}
export class DeductBlockedFundsError  extends ConvexError<{
  code: string,
  message: string,
  payload: DeductBlockedFundsPayload
  balance?: ResolvedType<ReturnType<typeof fetchBalance>>
}> {} 
export const deductBlockedFunds = async (ctx: MutationCtx, payload: DeductBlockedFundsPayload) => {
  const balance = await fetchBalance(ctx, payload.userId)

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
