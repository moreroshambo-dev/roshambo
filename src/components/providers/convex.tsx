import { ConvexReactClient, useConvexConnectionState, Authenticated } from "convex/react";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { useEffect } from "react";
import { useTelegram } from "./telegram";
const convexUrl = `${window.location.protocol}//${window.location.host}`;

const convex = new ConvexReactClient(convexUrl);

function TelegramAuth({ children }: { children: React.ReactNode }) {
  const { signIn } = useAuthActions();
  const { isWebSocketConnected } = useConvexConnectionState()
  const { rawLaunchParams, isTelegram } = useTelegram()

  useEffect(() => {
    async function auth(initDataRaw: string) {
      try {
        await signIn("tgMiniApp", { authData: initDataRaw });
      } catch (error) {

      }
    }

    if (isWebSocketConnected && rawLaunchParams) {
      auth(rawLaunchParams);
    }
  }, [isWebSocketConnected, rawLaunchParams, isTelegram]);

  return <>{children}</>;
}

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <TelegramAuth>
        <Authenticated>
          {children}  
        </Authenticated>
      </TelegramAuth>
    </ConvexAuthProvider>
  );
}
