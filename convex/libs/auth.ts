import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import type { UserIdentity } from "convex/server";
import type { Id } from "../_generated/dataModel";

export async function requireUser(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "User not found" });
  }

  return identity as UserIdentity & {userId: Id<'users'>};
}

export async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await requireUser(ctx)
  const user = await ctx.db.query("users").withIndex('by_id', (q) => q.eq('_id', identity.userId)).unique()

  if (!user) {
    throw new ConvexError({ code: "NOT_FOUND", message: "User not found." });
  }

  return user;
}
