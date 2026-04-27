import { query } from "../../_generated/server";
import { requireUser } from "../../libs/auth";
import { DEPOSIT_TABLES } from "./schema";

const TON_PAY_VAULT_ADDRESS = process.env.TON_PAY_VAULT_ADDRESS
const MIN_DEPOSIT = {
    TON: 0.1,
}

if (!TON_PAY_VAULT_ADDRESS) {
  throw new Error('TON_PAY_VAULT_ADDRESS is nil')
}

/** Get token info (rates, minimums) for the deposit form */
export const getTokenInfo = query({
  args: {},
  handler: async () => {
    return {
      tokens: [
        {
          symbol: "TON",
          name: "Toncoin",
          min: MIN_DEPOSIT.TON,
          decimals: 9,
          rate: 1000,
        },
      ],
      depositAddress: TON_PAY_VAULT_ADDRESS,
    };
  },
});

/** Get all deposits for the current user */
export const getMyDeposits = query({
  handler: async (ctx) => {
    const identity = await requireUser(ctx)
    const deposits = await ctx.db
      .query(DEPOSIT_TABLES.TON_TX)
      .withIndex('by_userId', (q) => q.eq('userId', identity.userId))
      .order("desc")
      .take(50);
    return deposits;
  },
});

