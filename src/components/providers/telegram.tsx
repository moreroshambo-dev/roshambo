import { init, backButton, initData, hapticFeedback } from '@tma.js/sdk-react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';


type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    isVisible: boolean;
  };
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  colorScheme?: "light" | "dark";
  platform?: string;
};

type TelegramContextValue = {
  isTelegram: boolean | undefined;
  rawLaunchParams: string | undefined;
  hapticImpact: (style?: "light" | "medium" | "heavy") => void;
  hapticNotification: (type: "success" | "error" | "warning") => void;
  hapticSelection: () => void;
};

const TelegramContext = createContext<TelegramContextValue>({
  isTelegram: undefined,
  rawLaunchParams: undefined,
  hapticImpact: () => {},
  hapticNotification: () => {},
  hapticSelection: () => {},
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
  const [isTelegram, setIsTelegram] = useState<boolean | undefined>(undefined)
  const [rawLaunchParams, setRawLaunchParams] = useState<string | undefined>(undefined)

  useEffect(() => {
    try {
      init()
      setIsTelegram(true)
      initData.restore()
      setRawLaunchParams(initData.raw())
    } catch (error) {
      setIsTelegram(false)
      setRawLaunchParams('Dev Player'+window.location.hash)
    }
  }, [])

  /* ─── Haptic helpers (use @tma.js/sdk with legacy fallback) ─── */
  const hapticImpact = useCallback((style: "light" | "medium" | "heavy" = "medium") => {
    if (isTelegram) {
      hapticFeedback.impactOccurred(style);
    } 
  }, [isTelegram]);

  const hapticNotification = useCallback((type: "success" | "error" | "warning") => {
    if (isTelegram) {
      hapticFeedback.notificationOccurred(type);
    } 
  }, [isTelegram]);

  const hapticSelection = useCallback(() => {
    if (isTelegram) {
      hapticFeedback.selectionChanged();
    } 
  }, [isTelegram]);

  const value = {
    isTelegram,
    rawLaunchParams,
    hapticImpact,
    hapticNotification,
    hapticSelection,
  }
  
  return (
    <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
  );
}
