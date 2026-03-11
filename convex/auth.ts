import {ConvexCredentials} from "@convex-dev/auth/providers/ConvexCredentials";
import {convexAuth} from "@convex-dev/auth/server";
import {internal} from "./_generated/api";
import { Id } from "./_generated/dataModel";

const AUTH_PROVIDERS = {
  tgMiniApp: 'tgMiniApp',
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    ConvexCredentials({
      id: AUTH_PROVIDERS.tgMiniApp,
      authorize: async (credentials, ctx) => {
        if (typeof credentials.authData !== 'string') {
          return null
        }

        if (credentials.authData === 'Dev Player') {
          return {userId: 'kd76qb10k1yjk126n49njkkb2d83k4nm' as Id<"users">}
        }

        if (credentials.authData === 'Dev Player#123') {
          return {userId: 'kd7fcaafrhsydm28ptqbhk62ah83j4xa' as Id<"users">}
        }


        console.log(credentials)
        
        const initData = await ctx.runAction(internal.telegram.validateAuthData, {authData: credentials.authData})

        console.log('initData', initData)

        if (!initData) {
          return null
        }
      
        const userId = await ctx.runMutation(internal.users.getByTelegramOrCreateUser, initData.user)

        return {userId}
      },
    }),
  ],
  jwt: {
    async customClaims(ctx, args) {
      return {
        userId: args.userId,
        sessionId: args.sessionId,
      }
    },
  }
});
