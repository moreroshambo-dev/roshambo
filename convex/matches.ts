import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";

const DEFAULT_BALANCE = 1000;

/** Helper to find user by telegramId (filter scan – table is small) */
async function findUser(ctx: QueryCtx | MutationCtx, telegramId: string) {
  const users = await ctx.db.query("users").collect();
  const user = users.find((u) => u.telegramId === telegramId);
  if (!user) {
    throw new ConvexError({ code: "NOT_FOUND", message: "User not found. Open the app first." });
  }
  return user;
}

/** Non-throwing check: does user already have an active match? */
async function hasActiveMatch(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<boolean> {
  const asCreator = await ctx.db
    .query("matches")
    .withIndex("by_creator", (q) => q.eq("creatorId", userId))
    .collect();
  if (asCreator.some((m) => m.status === "waiting" || m.status === "in_progress")) return true;
  const asOpponent = await ctx.db
    .query("matches")
    .withIndex("by_opponent", (q) => q.eq("opponentId", userId))
    .collect();
  if (asOpponent.some((m) => m.status === "in_progress")) return true;
  return false;
}

/** Check if user is already in an active (waiting or in_progress) match */
async function assertNoActiveMatch(ctx: MutationCtx, userId: Id<"users">) {
  // Check matches where user is creator and still active
  const asCreator = await ctx.db
    .query("matches")
    .withIndex("by_creator", (q) => q.eq("creatorId", userId))
    .collect();
  const activeAsCreator = asCreator.find(
    (m) => m.status === "waiting" || m.status === "in_progress",
  );
  if (activeAsCreator) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "You are already in an active match. Finish or cancel it first.",
    });
  }

  // Check matches where user is opponent and still in progress
  const asOpponent = await ctx.db
    .query("matches")
    .withIndex("by_opponent", (q) => q.eq("opponentId", userId))
    .collect();
  const activeAsOpponent = asOpponent.find(
    (m) => m.status === "in_progress",
  );
  if (activeAsOpponent) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "You are already in an active match. Finish it first.",
    });
  }
}

/** Create a new match with a bet */
export const createMatch = mutation({
  args: { telegramId: v.string(), betAmount: v.number() },
  handler: async (ctx, args) => {
    const user = await findUser(ctx, args.telegramId);
    const balance = user.tokenBalance ?? DEFAULT_BALANCE;

    // One player – one active match
    await assertNoActiveMatch(ctx, user._id);

    if (args.betAmount < 10) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Minimum bet is 10 tokens" });
    }
    if (args.betAmount > balance) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Insufficient tokens" });
    }

    await ctx.db.patch(user._id, { tokenBalance: balance - args.betAmount });

    const matchId = await ctx.db.insert("matches", {
      creatorId: user._id,
      betAmount: args.betAmount,
      status: "waiting",
    });

    return matchId;
  },
});

/** Join an open match */
export const joinMatch = mutation({
  args: { telegramId: v.string(), matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const user = await findUser(ctx, args.telegramId);

    // One player – one active match
    await assertNoActiveMatch(ctx, user._id);

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new ConvexError({ code: "NOT_FOUND", message: "Match not found" });
    if (match.status !== "waiting") throw new ConvexError({ code: "BAD_REQUEST", message: "Match is no longer available" });
    if (match.creatorId === user._id) throw new ConvexError({ code: "BAD_REQUEST", message: "Cannot join your own match" });

    const balance = user.tokenBalance ?? DEFAULT_BALANCE;
    if (match.betAmount > balance) throw new ConvexError({ code: "BAD_REQUEST", message: "Insufficient tokens to match this bet" });

    await ctx.db.patch(user._id, { tokenBalance: balance - match.betAmount });
    await ctx.db.patch(args.matchId, { opponentId: user._id, status: "in_progress" });

    return args.matchId;
  },
});

/** Cancel a waiting match (creator only) */
export const cancelMatch = mutation({
  args: { telegramId: v.string(), matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const user = await findUser(ctx, args.telegramId);

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new ConvexError({ code: "NOT_FOUND", message: "Match not found" });
    if (match.creatorId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Only the creator can cancel" });
    if (match.status !== "waiting") throw new ConvexError({ code: "BAD_REQUEST", message: "Can only cancel waiting matches" });

    const balance = user.tokenBalance ?? DEFAULT_BALANCE;
    await ctx.db.patch(user._id, { tokenBalance: balance + match.betAmount });
    await ctx.db.patch(args.matchId, { status: "cancelled" });
  },
});

const CHOICE_VALIDATOR = v.union(v.literal("rock"), v.literal("paper"), v.literal("scissors"));
type Choice = "rock" | "paper" | "scissors";

function resolveRPS(a: Choice, b: Choice): "first" | "second" | "draw" {
  if (a === b) return "draw";
  if (
    (a === "rock" && b === "scissors") ||
    (a === "paper" && b === "rock") ||
    (a === "scissors" && b === "paper")
  ) return "first";
  return "second";
}

/** Submit a choice for the current player */
export const makeChoice = mutation({
  args: { telegramId: v.string(), matchId: v.id("matches"), choice: CHOICE_VALIDATOR },
  handler: async (ctx, args) => {
    const user = await findUser(ctx, args.telegramId);

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new ConvexError({ code: "NOT_FOUND", message: "Match not found" });
    if (match.status !== "in_progress") throw new ConvexError({ code: "BAD_REQUEST", message: "Match is not in progress" });

    const isCreator = match.creatorId === user._id;
    const isOpponent = match.opponentId === user._id;
    if (!isCreator && !isOpponent) throw new ConvexError({ code: "FORBIDDEN", message: "You are not in this match" });

    if (isCreator && match.creatorChoice) throw new ConvexError({ code: "BAD_REQUEST", message: "You already made your choice" });
    if (isOpponent && match.opponentChoice) throw new ConvexError({ code: "BAD_REQUEST", message: "You already made your choice" });

    if (isCreator) {
      await ctx.db.patch(args.matchId, { creatorChoice: args.choice });
    } else {
      await ctx.db.patch(args.matchId, { opponentChoice: args.choice });
    }

    const creatorChoice = isCreator ? args.choice : match.creatorChoice;
    const opponentChoice = isOpponent ? args.choice : match.opponentChoice;

    if (creatorChoice && opponentChoice) {
      const outcome = resolveRPS(creatorChoice, opponentChoice);
      const totalPot = match.betAmount * 2;
      const creator = await ctx.db.get(match.creatorId);
      const opponent = match.opponentId ? await ctx.db.get(match.opponentId) : null;

      if (outcome === "draw") {
        if (creator) await ctx.db.patch(creator._id, { tokenBalance: (creator.tokenBalance ?? DEFAULT_BALANCE) + match.betAmount, totalDraws: (creator.totalDraws ?? 0) + 1 });
        if (opponent) await ctx.db.patch(opponent._id, { tokenBalance: (opponent.tokenBalance ?? DEFAULT_BALANCE) + match.betAmount, totalDraws: (opponent.totalDraws ?? 0) + 1 });
        await ctx.db.patch(args.matchId, { status: "completed", result: "draw", creatorChoice, opponentChoice });
      } else if (outcome === "first") {
        if (creator) await ctx.db.patch(creator._id, { tokenBalance: (creator.tokenBalance ?? DEFAULT_BALANCE) + totalPot, totalWins: (creator.totalWins ?? 0) + 1 });
        if (opponent) await ctx.db.patch(opponent._id, { totalLosses: (opponent.totalLosses ?? 0) + 1 });
        await ctx.db.patch(args.matchId, { status: "completed", result: "creator_win", winnerId: match.creatorId, creatorChoice, opponentChoice });
      } else {
        if (opponent) await ctx.db.patch(opponent._id, { tokenBalance: (opponent.tokenBalance ?? DEFAULT_BALANCE) + totalPot, totalWins: (opponent.totalWins ?? 0) + 1 });
        if (creator) await ctx.db.patch(creator._id, { totalLosses: (creator.totalLosses ?? 0) + 1 });
        await ctx.db.patch(args.matchId, { status: "completed", result: "opponent_win", winnerId: match.opponentId, creatorChoice, opponentChoice });
      }
    }
  },
});

/** Get a single match with player info */
export const getMatch = query({
  args: { telegramId: v.string(), matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const currentUser = await findUser(ctx, args.telegramId);

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new ConvexError({ code: "NOT_FOUND", message: "Match not found" });

    const creator = await ctx.db.get(match.creatorId);
    const opponent = match.opponentId ? await ctx.db.get(match.opponentId) : null;

    const isCreator = match.creatorId === currentUser._id;
    const isOpponent = match.opponentId === currentUser._id;
    const myChoice = isCreator ? match.creatorChoice : isOpponent ? match.opponentChoice : undefined;
    const opponentChoiceRevealed = match.status === "completed"
      ? (isCreator ? match.opponentChoice : match.creatorChoice)
      : undefined;

    return {
      _id: match._id,
      _creationTime: match._creationTime,
      betAmount: match.betAmount,
      status: match.status,
      result: match.result,
      winnerId: match.winnerId,
      creatorName: creator?.name ?? "Anonymous",
      opponentName: opponent?.name ?? null,
      creatorId: match.creatorId,
      opponentId: match.opponentId,
      isCreator,
      isOpponent,
      isParticipant: isCreator || isOpponent,
      myChoice,
      opponentChoice: opponentChoiceRevealed,
      creatorChoice: match.status === "completed" ? match.creatorChoice : undefined,
      opponentChoiceRaw: match.status === "completed" ? match.opponentChoice : undefined,
      // Rematch tracking
      creatorRematchReady: match.creatorRematchReady ?? false,
      opponentRematchReady: match.opponentRematchReady ?? false,
      nextMatchId: match.nextMatchId,
      splitCreatorMatchId: match.splitCreatorMatchId,
      splitOpponentMatchId: match.splitOpponentMatchId,
    };
  },
});

/** Quick start: join an existing open match or create a new one */
export const quickStart = mutation({
  args: { telegramId: v.string(), betAmount: v.number() },
  handler: async (ctx, args): Promise<{ matchId: string; action: "joined" | "created" }> => {
    const user = await findUser(ctx, args.telegramId);
    const balance = user.tokenBalance ?? DEFAULT_BALANCE;

    // One player – one active match
    await assertNoActiveMatch(ctx, user._id);

    if (args.betAmount < 10) throw new ConvexError({ code: "BAD_REQUEST", message: "Minimum bet is 10 tokens" });
    if (args.betAmount > balance) throw new ConvexError({ code: "BAD_REQUEST", message: "Insufficient tokens" });

    // Snapshot daily balance on first play of the day (UTC)
    const todayUTC = new Date().toISOString().slice(0, 10);
    if (user.dailyStartDate !== todayUTC) {
      await ctx.db.patch(user._id, { dailyStartDate: todayUTC, dailyStartBalance: balance });
    }

    const openMatches = await ctx.db
      .query("matches")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .collect();

    const available = openMatches.find((m) => m.betAmount === args.betAmount && m.creatorId !== user._id);

    if (available) {
      await ctx.db.patch(user._id, { tokenBalance: balance - args.betAmount });
      await ctx.db.patch(available._id, { opponentId: user._id, status: "in_progress" });
      return { matchId: available._id, action: "joined" };
    }

    await ctx.db.patch(user._id, { tokenBalance: balance - args.betAmount });
    const matchId = await ctx.db.insert("matches", { creatorId: user._id, betAmount: args.betAmount, status: "waiting" });
    return { matchId, action: "created" };
  },
});

/** Leave / abandon a match — refund the leaving player and revert to waiting */
export const leaveMatch = mutation({
  args: { telegramId: v.string(), matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const user = await findUser(ctx, args.telegramId);
    const match = await ctx.db.get(args.matchId);
    if (!match) return;

    const isCreator = match.creatorId === user._id;
    const isOpponent = match.opponentId === user._id;
    if (!isCreator && !isOpponent) return;

    // Don't touch completed or already cancelled matches
    if (match.status === "completed" || match.status === "cancelled") return;

    const balance = user.tokenBalance ?? DEFAULT_BALANCE;

    if (match.status === "waiting" && isCreator) {
      // Creator leaves a waiting match → cancel and refund
      await ctx.db.patch(user._id, { tokenBalance: balance + match.betAmount });
      await ctx.db.patch(args.matchId, { status: "cancelled" });
      return;
    }

    if (match.status === "in_progress") {
      // Refund the leaving player
      await ctx.db.patch(user._id, { tokenBalance: balance + match.betAmount });

      if (isOpponent) {
        // Opponent leaves → match goes back to waiting, keep creator
        await ctx.db.replace(args.matchId, {
          creatorId: match.creatorId,
          betAmount: match.betAmount,
          status: "waiting",
        });
      } else {
        // Creator leaves → make opponent the new creator, back to waiting
        await ctx.db.replace(args.matchId, {
          creatorId: match.opponentId!,
          betAmount: match.betAmount,
          status: "waiting",
        });
      }
    }
  },
});

/** Signal readiness for auto-rematch. When both players signal, a new match is created. */
export const signalRematchReady = mutation({
  args: { telegramId: v.string(), matchId: v.id("matches") },
  handler: async (ctx, args): Promise<string | null> => {
    const user = await findUser(ctx, args.telegramId);
    const match = await ctx.db.get(args.matchId);
    if (!match || match.status !== "completed") return null;

    // Already transitioned to a new match or split
    if (match.nextMatchId) return match.nextMatchId;
    if (match.splitCreatorMatchId || match.splitOpponentMatchId) return null;

    const isCreator = match.creatorId === user._id;
    const isOpponent = match.opponentId === user._id;
    if (!isCreator && !isOpponent) return null;

    // Mark this player ready
    if (isCreator) await ctx.db.patch(args.matchId, { creatorRematchReady: true });
    else await ctx.db.patch(args.matchId, { opponentRematchReady: true });

    const creatorReady = isCreator ? true : !!match.creatorRematchReady;
    const opponentReady = isOpponent ? true : !!match.opponentRematchReady;

    if (creatorReady && opponentReady && match.opponentId) {
      // Safety: make sure neither player is already in another active match
      if (await hasActiveMatch(ctx, match.creatorId)) return null;
      if (await hasActiveMatch(ctx, match.opponentId)) return null;

      const creator = await ctx.db.get(match.creatorId);
      const opponent = await ctx.db.get(match.opponentId);
      if (!creator || !opponent) return null;

      const cBal = creator.tokenBalance ?? DEFAULT_BALANCE;
      const oBal = opponent.tokenBalance ?? DEFAULT_BALANCE;
      if (cBal < match.betAmount || oBal < match.betAmount) return null;

      // Deduct bets
      await ctx.db.patch(creator._id, { tokenBalance: cBal - match.betAmount });
      await ctx.db.patch(opponent._id, { tokenBalance: oBal - match.betAmount });

      const newMatchId = await ctx.db.insert("matches", {
        creatorId: match.creatorId,
        opponentId: match.opponentId,
        betAmount: match.betAmount,
        status: "in_progress",
      });
      await ctx.db.patch(args.matchId, { nextMatchId: newMatchId });
      return newMatchId;
    }

    return null;
  },
});

/** Change opponent: split both players into separate waiting matches */
export const changeOpponent = mutation({
  args: { telegramId: v.string(), matchId: v.id("matches") },
  handler: async (ctx, args): Promise<string | null> => {
    const user = await findUser(ctx, args.telegramId);
    const match = await ctx.db.get(args.matchId);
    if (!match || match.status !== "completed") return null;
    if (!match.opponentId) return null;

    // Already transitioned
    if (match.nextMatchId || match.splitCreatorMatchId || match.splitOpponentMatchId) {
      // Return existing split match for requesting user
      const isCreator = match.creatorId === user._id;
      if (isCreator && match.splitCreatorMatchId) return match.splitCreatorMatchId;
      if (!isCreator && match.splitOpponentMatchId) return match.splitOpponentMatchId;
      return null;
    }

    const creator = await ctx.db.get(match.creatorId);
    const opponent = await ctx.db.get(match.opponentId);
    if (!creator || !opponent) return null;

    const cBal = creator.tokenBalance ?? DEFAULT_BALANCE;
    const oBal = opponent.tokenBalance ?? DEFAULT_BALANCE;

    // Create separate waiting matches for each player who can afford the bet
    let splitCreatorId: Id<"matches"> | undefined;
    let splitOpponentId: Id<"matches"> | undefined;

    if (cBal >= match.betAmount && !(await hasActiveMatch(ctx, creator._id))) {
      await ctx.db.patch(creator._id, { tokenBalance: cBal - match.betAmount });
      splitCreatorId = await ctx.db.insert("matches", {
        creatorId: creator._id,
        betAmount: match.betAmount,
        status: "waiting",
      });
    }

    if (oBal >= match.betAmount && !(await hasActiveMatch(ctx, opponent._id))) {
      await ctx.db.patch(opponent._id, { tokenBalance: oBal - match.betAmount });
      splitOpponentId = await ctx.db.insert("matches", {
        creatorId: opponent._id,
        betAmount: match.betAmount,
        status: "waiting",
      });
    }

    // Store references on old match so the other player's client can navigate
    if (splitCreatorId && splitOpponentId) {
      await ctx.db.patch(args.matchId, { splitCreatorMatchId: splitCreatorId, splitOpponentMatchId: splitOpponentId });
    } else if (splitCreatorId) {
      await ctx.db.patch(args.matchId, { splitCreatorMatchId: splitCreatorId });
    } else if (splitOpponentId) {
      await ctx.db.patch(args.matchId, { splitOpponentMatchId: splitOpponentId });
    }

    // Return the requesting user's new match
    const isCreator = match.creatorId === user._id;
    return isCreator ? (splitCreatorId ?? null) : (splitOpponentId ?? null);
  },
});

/** Real-time feed of recent wins (last 20 completed matches with a winner) */
export const getRecentWins = query({
  args: {},
  handler: async (ctx) => {
    const completed = await ctx.db
      .query("matches")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .take(40);

    // Only matches with a winner (not draws)
    const withWinner = completed.filter((m) => m.winnerId);

    const enriched = await Promise.all(
      withWinner.slice(0, 20).map(async (match) => {
        const winner = match.winnerId ? await ctx.db.get(match.winnerId) : null;
        return {
          _id: match._id,
          _creationTime: match._creationTime,
          winnerName: winner?.name ?? "Anonymous",
          winnerId: match.winnerId,
          betAmount: match.betAmount,
          payout: match.betAmount * 2,
        };
      }),
    );
    return enriched;
  },
});

/** Get matches for the current user */
export const getMyMatches = query({
  args: { telegramId: v.string() },
  handler: async (ctx, args) => {
    const user = await findUser(ctx, args.telegramId);

    const createdMatches = await ctx.db
      .query("matches")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .order("desc")
      .take(20);

    const joinedMatches = await ctx.db
      .query("matches")
      .withIndex("by_opponent", (q) => q.eq("opponentId", user._id))
      .order("desc")
      .take(20);

    const allMatchIds = new Set<string>();
    const allMatches: typeof createdMatches = [];
    for (const m of [...createdMatches, ...joinedMatches]) {
      if (!allMatchIds.has(m._id)) {
        allMatchIds.add(m._id);
        allMatches.push(m);
      }
    }
    allMatches.sort((a, b) => b._creationTime - a._creationTime);

    const enriched = await Promise.all(
      allMatches.slice(0, 20).map(async (match) => {
        const creator = await ctx.db.get(match.creatorId);
        const opponent = match.opponentId ? await ctx.db.get(match.opponentId) : null;
        return {
          ...match,
          creatorName: creator?.name ?? "Anonymous",
          opponentName: opponent?.name ?? null,
          isCreator: match.creatorId === user._id,
        };
      }),
    );

    return enriched;
  },
});

/** Match history for current user (completed only) */
export const getMatchHistory = query({
  args: { telegramId: v.string() },
  handler: async (ctx, args) => {
    const user = await findUser(ctx, args.telegramId);

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
    const allUsers = await ctx.db.query("users").collect();

    const entries = allUsers
      .map((u) => {
        const balance = u.tokenBalance ?? 1000;
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
