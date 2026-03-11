import { ConvexError, v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireUser } from "../../libs/auth";

export const setEnabled = mutation({
    args: { enabled: v.boolean() },
    handler: async (ctx, args) => {
        const identity = await requireUser(ctx)

        const userState = await ctx.db.query('rps_user_state').withIndex('by_userId', (q) => q.eq('userId', identity.userId)).unique()

        if (!userState) {
            throw new ConvexError({ code: 'BAD_REQUEST', message: 'not found state' })
        }

        await ctx.db.patch('rps_user_state', userState._id, {
            autoSelectEnabled: args.enabled,
        })
    },
})

export const state = query({
    handler: async (ctx) => {
        const identity = await requireUser(ctx)
        const userState = await ctx.db.query('rps_user_state').withIndex('by_userId', (q) => q.eq('userId', identity.userId)).unique()

        if (!userState) {
            return undefined
        }

        return {
            autoSelectEnabled: userState.autoSelectEnabled,
        }
    }
})