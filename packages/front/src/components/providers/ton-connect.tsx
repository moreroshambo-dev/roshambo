import { TonConnectUIProvider } from "@tonconnect/ui-react";

const MANIFEST_URL = `${window.location.origin}/tonconnect-manifest.json`

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
