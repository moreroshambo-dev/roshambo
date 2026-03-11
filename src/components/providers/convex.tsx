import { ConvexProvider as BaseConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL ?? `${window.location.protocol}//${window.location.host}`;
const convex = new ConvexReactClient(convexUrl);

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseConvexProvider client={convex}>
      {children}
    </BaseConvexProvider>
  );
}
