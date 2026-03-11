import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { RPS_TABLES } from "./libs/rps";
import { requireUser } from "../../libs/auth";

const DEFAULT_SETTINGS = Object.freeze({
    autoSelectEnabled: false,
    autoSelectDuration: 2_000,
})

export const setAutoSelect = mutation({
    args: {enabled: v.boolean()},
    handler: async (ctx, args) => {
        const {userId} = await requireUser(ctx)
        const settings = await ctx.db.query(RPS_TABLES.SETTINGS).withIndex('by_userId', (q) => q.eq('userId', userId)).unique()

        if (!settings) {
            if (DEFAULT_SETTINGS.autoSelectEnabled !== args.enabled) {
                await ctx.db.insert(RPS_TABLES.SETTINGS, {
                    ...DEFAULT_SETTINGS,
                    autoSelectEnabled: args.enabled,
                    userId,
                })
            }
        } else {
            if (settings.autoSelectEnabled !== args.enabled) {
                await ctx.db.patch(RPS_TABLES.SETTINGS, settings._id, {autoSelectEnabled: args.enabled})
            }
        }
    }
})

export const get = query({
    handler: async (ctx) => {
        const {userId} = await requireUser(ctx)
        const settings = await ctx.db.query(RPS_TABLES.SETTINGS).withIndex('by_userId', (q) => q.eq('userId', userId)).unique()

        if (settings) {
            return {
                ...DEFAULT_SETTINGS,
                autoSelectEnabled: settings.autoSelectEnabled,
            }
        }

        return DEFAULT_SETTINGS
    }
})