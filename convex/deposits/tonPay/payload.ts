'use node'

import { createTonPayTransfer } from "@ton-pay/api";
import { action } from "../../_generated/server";
import { requireUser } from "../../libs/auth";
import { v } from "convex/values";

const TON_PAY_VAULT_ADDRESS = process.env.TON_PAY_VAULT_ADDRESS

if (!TON_PAY_VAULT_ADDRESS) {
  throw new Error('TON_PAY_VAULT_ADDRESS is nil')
}

export const get = action({
  args: {
    amount: v.number(),
    senderAddr: v.string(),
  },
  handler: async (ctx, args) => {
    const { amount, senderAddr } = args;

    const {userId} = await requireUser(ctx);
    const { message, reference, bodyBase64Hash } = await createTonPayTransfer(
      {
        amount,
        asset: "TON",
        recipientAddr: TON_PAY_VAULT_ADDRESS,
        senderAddr,
        commentToSender: `Your deposit is on the way`,
        commentToRecipient: userId,
      },
      {
        chain: "testnet",
        apiKey: process.env.TON_PAY_API_KEY, // optional
      }
    );

    return { message, reference, bodyBase64Hash }
  }
}) 
