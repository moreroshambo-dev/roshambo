import { query } from "./_generated/server";
import { RPS_RESULT, RPS_TABLES } from "./game/rcp/libs/rps.ts";
import { getUser } from "./libs/auth.ts";

/** Real-time feed of recent wins (last 20 completed matches with a winner) */
export const getRecentWins = query({
  args: {},
  handler: async (ctx) => {
    const completed = await ctx.db
      .query(RPS_TABLES.HISTORY)
      .withIndex('by_result', (q) => q.eq('result', RPS_RESULT.WIN))
      .order("desc")
      .take(40);

    // Only matches with a winner (not draws)
    const enriched = await Promise.all(
      completed.slice(0, 20).map(async (match) => {
        const winner = match.userId ? await ctx.db.get(match.userId) : null;
        return {
          _id: match._id,
          _creationTime: match._creationTime,
          winnerName: winner?.name ?? "Anonymous",
          winnerId: match.userId,
          betAmount: match.betAmount,
          payout: match.betAmount * 2,
        };
      }),
    );
    return enriched;
  },
});

/** Match history for current user (completed only) */
export const getMatchHistory = query({
  handler: async (ctx) => {
    const user = await getUser(ctx);

    const created = await ctx.db.query("matches").withIndex("by_creator", (q) => q.eq("creatorId", user._id)).order("desc").take(100);
    const joined = await ctx.db.query("matches").withIndex("by_opponent", (q) => q.eq("opponentId", user._id)).order("desc").take(100);

    const seen = new Set<string>();
    const all: typeof created = [];
    for (const m of [...created, ...joined]) {
      if (!seen.has(m._id) && m.status === "completed") {
        seen.add(m._id);
        all.push(m);
      }
    }
    all.sort((a, b) => b._creationTime - a._creationTime);

    const enriched = await Promise.all(
      all.slice(0, 50).map(async (match) => {
        const creator = await ctx.db.get(match.creatorId);
        const opponent = match.opponentId ? await ctx.db.get(match.opponentId) : null;
        const isCreator = match.creatorId === user._id;
        const didWin = (isCreator && match.result === "creator_win") || (!isCreator && match.result === "opponent_win");
        const myChoice = isCreator ? match.creatorChoice : match.opponentChoice;
        const theirChoice = isCreator ? match.opponentChoice : match.creatorChoice;

        return {
          _id: match._id,
          _creationTime: match._creationTime,
          betAmount: match.betAmount,
          result: match.result,
          didWin,
          isDraw: match.result === "draw",
          myChoice,
          theirChoice,
          opponentName: isCreator ? (opponent?.name ?? "Anonymous") : (creator?.name ?? "Anonymous"),
        };
      }),
    );
    return enriched;
  },
});

/** Daily multiplier leaderboard */
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const todayUTC = new Date().toISOString().slice(0, 10);
    const [allUsers, allBalances] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("balances").collect(),
    ]);

    const balanceMap = new Map<string, number>();
    allBalances.forEach((b) => {
      balanceMap.set(b.userId, b.available);
    });

    const entries = allUsers
      .map((u) => {
        const balance = balanceMap.get(u._id) ?? 0
        const startBalance = u.dailyStartDate === todayUTC && u.dailyStartBalance ? u.dailyStartBalance : balance;
        const multiplier = startBalance > 0 ? balance / startBalance : 1;
        const playedToday = u.dailyStartDate === todayUTC;
        return {
          _id: u._id,
          name: u.name ?? "Anonymous",
          tokenBalance: balance,
          totalWins: u.totalWins ?? 0,
          totalLosses: u.totalLosses ?? 0,
          multiplier: Math.round(multiplier * 100) / 100,
          playedToday,
        };
      })
      .filter((e) => e.playedToday)
      .sort((a, b) => b.multiplier - a.multiplier);

    return entries.slice(0, 50);
  },
});
