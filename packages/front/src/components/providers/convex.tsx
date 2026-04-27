import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

const convexUrl = `${window.location.protocol}//${window.location.host}`;
const convex = new ConvexReactClient(convexUrl, {
  verbose: true,
});
const AUTH_STORAGE_NAMESPACE = `${convexUrl}:auth-v3`;

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider
      client={convex}
      storageNamespace={AUTH_STORAGE_NAMESPACE}
    >
      {children}
    </ConvexAuthProvider>
  );
}
