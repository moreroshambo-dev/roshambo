"use node"

import crypto from 'crypto';
import { internalActionGeneric } from "convex/server";
import { v } from "convex/values";

const DEPOSIT_API_PUBLIC_KEY = process.env.DEPOSIT_API_PUBLIC_KEY

if (typeof DEPOSIT_API_PUBLIC_KEY !== 'string') {
  throw new Error('process.env.DEPOSIT_API_PUBLIC_KEY is not define')
}


function verifyMessage(publicKeyPem: string, message: string, signatureBase64: string) {
  return crypto.verify(
    null,
    Buffer.from(message),
    publicKeyPem,
    Buffer.from(signatureBase64, 'base64')
  );
}

export const checkSignature = internalActionGeneric({
  args: {
    signatureBase64: v.string(),
    message: v.any(),
  },
  handler: (ctx, args): boolean => {
    const isVerified =  verifyMessage(
      DEPOSIT_API_PUBLIC_KEY,
      args.message,
      args.signatureBase64,
    )

    return isVerified
  }
})