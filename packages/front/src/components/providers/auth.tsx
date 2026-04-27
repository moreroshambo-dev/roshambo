import {
  AuthLoading,
  useConvexConnectionState,
  Authenticated,
  useConvexAuth,
  Unauthenticated,
} from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "./telegram";

function FullscreenStatus({ children }: { children: React.ReactNode }) {
  return (
    <div >
      <p>{children}</p>
    </div>
  );
}

export function TelegramAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const { isWebSocketConnected } = useConvexConnectionState();
  const { rawLaunchParams, close } = useTelegram();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawLaunchParams || isAuthenticated || isLoading) {
      return
    }
    signIn('tgMiniApp', {
      authData: rawLaunchParams,
    }).then((result) => {
      if (!result.signingIn) {
        throw new Error('Unknown user')
      }
      navigate('/arena')
    }).catch((error) => {
      alert('Сессия разорвана. Перезапустите приложение')
      close()

      console.error(error)
      setAuthError(error)
    })
  }, [rawLaunchParams, isAuthenticated, isLoading])

  return (
    <>
    {isLoading}
      <AuthLoading>
        <FullscreenStatus>Проверяем сессию…</FullscreenStatus>
      </AuthLoading>

      <Unauthenticated>
        {authError ? (
          <FullscreenStatus>{authError}</FullscreenStatus>
        ) : isLoading || (rawLaunchParams && !isWebSocketConnected) ? (
          <FullscreenStatus>Подключаем Telegram Mini App…</FullscreenStatus>
        ) : (
          <FullscreenStatus>
            Откройте приложение через Telegram.
          </FullscreenStatus>
        )}
      </Unauthenticated>
      <Authenticated>{children}</Authenticated>
    </>
  );
}
