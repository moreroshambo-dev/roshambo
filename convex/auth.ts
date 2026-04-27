import {ConvexCredentials} from "@convex-dev/auth/providers/ConvexCredentials";
import {convexAuth} from "@convex-dev/auth/server";
import {internal} from "./_generated/api";

const AUTH_PROVIDERS = {
  tgMiniApp: 'tgMiniApp',
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    ConvexCredentials({
      id: AUTH_PROVIDERS.tgMiniApp,
      authorize: async (credentials, ctx) => {
        console.log(1, credentials)

        if (typeof credentials.authData !== 'string') {
          console.log('ConvexCredentials: credentials.authData is nil')
          return null
        }

        console.log(2, credentials)
        
        const initData = await ctx.runAction(internal.telegram.validateAuthData, {authData: credentials.authData})

        console.log(3, initData)
        if (!initData) {
          console.log('ConvexCredentials: initData is nil')

          return null
        }
              console.log(4)

        const userId = await ctx.runMutation(internal.users.getByTelegramOrCreateUser, initData.user)
              console.log(5, userId)

        if (!userId) {
          console.log('ConvexCredentials: userId is nil')
        } else {
          console.log('userId: '+userId)
        }

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
