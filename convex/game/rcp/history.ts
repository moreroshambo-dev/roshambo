import { query } from "../../_generated/server";
import { requireUser } from "../../libs/auth";
import { RPS_TABLES } from "./libs/rps";

export const get = query({
    handler: async (ctx) => {
        const {userId} = await requireUser(ctx)
        const matches = await ctx.db.query(RPS_TABLES.HISTORY).withIndex('by_userId', (q) => q.eq('userId', userId)).take(100)

        return matches.map(match => ({
            betAmount: match.betAmount,
            totalPot: match.totalPot,
            result: match.result,
            opponentAvatar: match.opponentAvatar,
            opponentName: match.opponentName,
            opponentTurn: match.opponentTurn,
            myTurn: match.myTurn,
            _creationTime: match._creationTime,
        }))
    }
})