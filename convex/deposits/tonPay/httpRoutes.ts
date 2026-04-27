import { httpActionGeneric, HttpRouter } from "convex/server";
import { internal } from "../../_generated/api";

const DEPOSIT_SIGNATURE_HEADER = process.env.DEPOSIT_SIGNATURE_HEADER

if (typeof DEPOSIT_SIGNATURE_HEADER !== 'string') {
  throw new Error('process.env.DEPOSIT_SIGNATURE_HEADER is not define')
}

export const deposits = {
  /**
   * Add HTTP actions for Internal api.
   * 
   * @param http your HTTP router
   */
  addHttpRoutes: (http: HttpRouter) => {
    http.route({
      path: '/private-api/deposit/process-tx', 
      method: 'POST',
      handler: httpActionGeneric(async (ctx, req) => {
        const signatureBase64 = req.headers.get(DEPOSIT_SIGNATURE_HEADER)

        if (!signatureBase64) {
          return new Response(null, {status: 401});
        }
  
        const message = await req.text();
        const isVerified = await ctx.runAction(internal.deposits.tonPay.signature.checkSignature, {message, signatureBase64})

        if (!isVerified) {
          return new Response(null, {status: 401});
        }

        const body = JSON.parse(message)

        await ctx.runMutation(internal.deposits.tonPay.internal.processTx, body);

        return new Response(null, {
          status: 200,
        });
      })
    })

    http.route({
      path: '/private-api/deposit/cursor', 
      method: 'POST',
      handler: httpActionGeneric(async (ctx, req) => {
        const signatureBase64 = req.headers.get(DEPOSIT_SIGNATURE_HEADER)

        if (!signatureBase64) {
          console.debug('signatureBase64 is nil')
          return new Response(null, {status: 401});
        }
  
        const message = await req.text();
        const isVerified = await ctx.runAction(internal.deposits.tonPay.signature.checkSignature, {message, signatureBase64})

        if (!isVerified) {
          return new Response(null, {status: 401});
        }

        const body = JSON.parse(message)
    
        if (body.blockchain !== 'ton' && body.blockchain !== 'testnet-ton') {
          return new Response(null, {
            status: 400,
          });
        }

        const oracle = await ctx.runQuery(internal.deposits.tonPay.internal.getOracle, {blockchain: body.blockchain});

        return new Response(
          JSON.stringify({cursor: oracle.cursor}),
          {status: 200},
        );
      })
    })
  }
}