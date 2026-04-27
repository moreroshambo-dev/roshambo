import { ConvexError, v } from "convex/values"
import { internalMutation, internalQuery } from "../../_generated/server"
import { BLOCKCHAIN_VALIDATOR, DEPOSIT_TABLES, TON_TX_TABLE_SCHEMA, TX_STATUS } from "./schema"
import { creditBalance } from "../../libs/balances"
import { internal } from "../../_generated/api"

export const processTx = internalMutation({
  args: {
    tx: v
      .object({...TON_TX_TABLE_SCHEMA}).omit(
        'blockchain',
      ),
    cursor: v.number(),
    blockchain: BLOCKCHAIN_VALIDATOR,
  },
  handler: async (ctx, args) => {
    const oracle = await ctx.runQuery(internal.deposits.tonPay.internal.getOracle, {blockchain: args.blockchain})

    if (!oracle) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Не найдео оракул" })
    }

    if ((oracle.cursor + 1) !== args.cursor) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Сбился курсор" })
    }
  
    const existingTx = await ctx.db
      .query(DEPOSIT_TABLES.TON_TX)
      .withIndex('by_hash_blockchain', (q) => q.eq('hash', args.tx.hash).eq('blockchain', args.blockchain))
      .unique()

    if (!existingTx) {
      await ctx.db.insert(DEPOSIT_TABLES.TON_TX, {
        userId: args.tx.userId,
        hash: args.tx.hash,
        status: args.tx.status,
        creditedTokens: args.tx.amount * 1000,
        amount: args.tx.amount,
        asset: args.tx.asset,
        from: args.tx.from,
        to: args.tx.to,
        initiatedAt: args.tx.initiatedAt,
        blockchain: args.blockchain,
      })
    } else {
      if (existingTx.status === TX_STATUS.ERROR) {
        throw new ConvexError({ code: "BAD_REQUEST", message: "Транзакция уже в ошибке" });
      }

      if (existingTx.status === TX_STATUS.SUCCESS) {
        throw new ConvexError({ code: "BAD_REQUEST", message: "Транзакция уже помечена как выпонена" });
      }

      if (args.tx.status === existingTx.status) {
        throw new ConvexError({ code: "BAD_REQUEST", message: "Обновление транзакции не меняет статус" });
      }

      // Проверим что обновился только статус, а адреса и кол-во актива, актив и блокчейн не поменялись
      if (
        existingTx.from !== args.tx.from
        || existingTx.to !== args.tx.to
        || existingTx.amount !== args.tx.amount
        || existingTx.asset !== args.tx.asset
        || existingTx.blockchain !== args.blockchain
      ) {
        throw new ConvexError({ code: "BAD_REQUEST", message: "У транзакции обновился не только статус" });
      }
    
      await ctx.db.patch(DEPOSIT_TABLES.TON_TX, existingTx._id, {
        status: args.tx.status,
      })

      if (args.tx.status === TX_STATUS.SUCCESS) {
        await creditBalance(ctx, {
          userId: args.tx.userId,
          amount: args.tx.creditedTokens,
        })
      }
    }

    await ctx.db.patch(DEPOSIT_TABLES.ORACLE, oracle._id, {cursor: args.cursor})
  }
})

export const getOracle = internalQuery({
  args: {
    blockchain: BLOCKCHAIN_VALIDATOR,
  },
  handler: async (ctx, args) => {
    const oracle = await ctx.db
      .query(DEPOSIT_TABLES.ORACLE)
      .withIndex('by_blockchain', (q) => q.eq('blockchain', args.blockchain))
      .unique()

    if (!oracle) {
      throw new ConvexError({code: 'UNKNOWN_ORACLE', message: 'не найден оракул'})
    }

    return {
      _id: oracle._id,
      cursor: oracle.cursor,
      blockchain: oracle.blockchain,
      publicKey: oracle.publicKey,
    }
  }
})