'use node';

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { validate, parse, type InitData } from '@tma.js/init-data-node';

let TG_BOT_TOKEN: string

if (!process.env.TG_BOT_TOKEN) {
    throw new Error('TG_BOT_TOKEN is nil')
}

TG_BOT_TOKEN = process.env.TG_BOT_TOKEN

export const validateAuthData = internalAction({
    args: {
        authData: v.string(),
    },
    handler: (ctx, args) => {
        const rowData: InitData = parse(args.authData)

        if (process.env.SKIP_AUTH_FOR_DEV_USERS !== 'true' || rowData.user?.id !== 1) {
            try {
                validate(args.authData, TG_BOT_TOKEN, {
                    expiresIn: 7200,
                });
            } catch (error) {
                console.error(error)
                return null
            }
        }

        const rowUser = rowData.user

        if (!rowUser || rowUser.is_bot) {
            return null
        }

        return {
            user: {
                telegramId: rowUser.id,
                telegramFirstName: rowUser.first_name.trim(),
                telegramLastName: rowUser.last_name?.trim(),
                telegramUsername: rowUser.username,
                telegramPhotoUrl: rowUser.photo_url,
            }
        }
    }
})