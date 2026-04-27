import {
  initData,
  hapticFeedback,
  miniApp,
} from "@tma.js/sdk-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type TelegramContextValue = {
  isTelegram: boolean | undefined;
  rawLaunchParams: string | undefined;
  hapticImpact: (style?: "light" | "medium" | "heavy") => void;
  hapticNotification: (type: "success" | "error" | "warning") => void;
  hapticSelection: () => void;
  close: () => void;
};

const TelegramContext = createContext<TelegramContextValue>({
  isTelegram: undefined,
  rawLaunchParams: undefined,
  hapticImpact: () => {},
  hapticNotification: () => {},
  hapticSelection: () => {},
  close: () => {},
});

export function useTelegram() {
  const context = useContext(TelegramContext);

  if (!context) {
    throw new Error("useTelegram must be used within a <TelegramProvider />");
  }

  return context;
}

/**
 * Reads the Telegram WebApp initDataUnsafe to identify the user.
 * Falls back to a deterministic dev ID when running outside Telegram.
 * Initialises @tma.js/sdk for safe-area, viewport, and haptics.
 */
export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isTelegram, setIsTelegram] = useState<boolean | undefined>(undefined);
  const [rawLaunchParams, setRawLaunchParams] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    try {
      initData.restore();
      const launchParams = initData.raw();

      setRawLaunchParams(launchParams);
      setIsTelegram(Boolean(launchParams));

      if (launchParams) {
        miniApp.ready();
      }
    } catch (error) {
      console.error(error);
      setIsTelegram(false);
      setRawLaunchParams(undefined);
    }
  }, []);

  /* ─── Haptic helpers (use @tma.js/sdk with legacy fallback) ─── */
  const hapticImpact = useCallback(
    (style: "light" | "medium" | "heavy" = "medium") => {
      if (isTelegram) {
        hapticFeedback.impactOccurred(style);
      }
    },
    [isTelegram],
  );

  const hapticNotification = useCallback(
    (type: "success" | "error" | "warning") => {
      if (isTelegram) {
        hapticFeedback.notificationOccurred(type);
      }
    },
    [isTelegram],
  );

  const hapticSelection = useCallback(() => {
    if (isTelegram) {
      hapticFeedback.selectionChanged();
    }
  }, [isTelegram]);

  const close = useCallback(() => {
    if (isTelegram) {
      miniApp.close();
    } else {
      window.close();
    }
  }, [isTelegram]);

  const value = {
    isTelegram,
    rawLaunchParams,
    hapticImpact,
    hapticNotification,
    hapticSelection,
    close,
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}
