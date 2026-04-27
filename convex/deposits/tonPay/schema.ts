import { defineTable } from "convex/server";
import { v } from "convex/values";

export const BLOCKCHAIN_VALIDATOR = v.union(
  v.literal('ton'),
  v.literal('testnet-ton')
)

export const TX_STATUS = Object.freeze({
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
})

export const DEPOSIT_TABLES = Object.freeze({
  TON_TX: 'deposit_tx_ton',
  ORACLE: 'deposit_oracles',
})

export const DEPOSIT_ORACLE_SCHEMA = Object.freeze({
  blockchain: BLOCKCHAIN_VALIDATOR,
  cursor: v.number(),
  publicKey: v.string()
})

export const TON_TX_TABLE_SCHEMA = Object.freeze({
  userId: v.id('users'),
  hash: v.string(),
  from: v.string(),
  to: v.string(),
  blockchain: BLOCKCHAIN_VALIDATOR,
  asset: v.literal('ton'),
  amount: v.number(),
  status: v.union(
    v.literal(TX_STATUS.PENDING),
    v.literal(TX_STATUS.SUCCESS),
    v.literal(TX_STATUS.ERROR),
  ),
  creditedTokens: v.number(),
  initiatedAt: v.number(),
})

export const depositsTables = Object.freeze({
  [DEPOSIT_TABLES.TON_TX]: defineTable(TON_TX_TABLE_SCHEMA)
    .index('by_hash_blockchain', ['hash', 'blockchain'])
    .index('by_userId', ['userId']),
  [DEPOSIT_TABLES.ORACLE]: defineTable(DEPOSIT_ORACLE_SCHEMA)
    .index('by_blockchain', ['blockchain'])
})
