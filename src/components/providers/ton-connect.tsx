import { TonConnectUIProvider } from "@tonconnect/ui-react";

const MANIFEST_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/tonconnect-manifest.json`
    : "https://rps-arena.onhercules.app/tonconnect-manifest.json";

/**
 * Wraps children with the TonConnect UI provider.
 * The manifest URL is auto-detected from the current origin.
 */
export function TonConnectProvider({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      {children}
    </TonConnectUIProvider>
  );
}
