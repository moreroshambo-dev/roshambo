import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  init as initTma,
  viewport,
  miniApp as tmaApp,
  backButton as tmaBackButton,
  hapticFeedback as tmaHaptic,
} from "@tma.js/sdk";

/** Shape of the Telegram WebApp user object (from legacy telegram-web-app.js) */
type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
};

type TelegramWebApp = {
  initDataUnsafe?: { user?: TelegramUser };
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

type SafeAreaInsets = { top: number; bottom: number; left: number; right: number };

type TelegramContextValue = {
  telegramId: string | null;
  name: string | null;
  isReady: boolean;
  isTelegram: boolean;
  hapticImpact: (style?: "light" | "medium" | "heavy") => void;
  hapticNotification: (type: "success" | "error" | "warning") => void;
  hapticSelection: () => void;
  showBackButton: (onBack: () => void) => void;
  hideBackButton: () => void;
  safeArea: SafeAreaInsets;
  contentSafeArea: SafeAreaInsets;
};

const ZERO_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

const TelegramContext = createContext<TelegramContextValue>({
  telegramId: null,
  name: null,
  isReady: false,
  isTelegram: false,
  hapticImpact: () => {},
  hapticNotification: () => {},
  hapticSelection: () => {},
  showBackButton: () => {},
  hideBackButton: () => {},
  safeArea: ZERO_INSETS,
  contentSafeArea: ZERO_INSETS,
});

export function useTelegram() {
  return useContext(TelegramContext);
}

/** Access the global Telegram WebApp object (legacy script) */
function getTelegramWebApp(): TelegramWebApp | null {
  const tg = (window as unknown as Record<string, unknown>).Telegram as
    | { WebApp?: TelegramWebApp }
    | undefined;
  return tg?.WebApp ?? null;
}

/** Push CSS custom properties onto :root for safe area usage */
function setSafeAreaCssVars(sa: SafeAreaInsets, csa: SafeAreaInsets) {
  const root = document.documentElement;
  root.style.setProperty("--tg-safe-area-top", `${sa.top}px`);
  root.style.setProperty("--tg-safe-area-bottom", `${sa.bottom}px`);
  root.style.setProperty("--tg-safe-area-left", `${sa.left}px`);
  root.style.setProperty("--tg-safe-area-right", `${sa.right}px`);
  root.style.setProperty("--tg-content-safe-area-top", `${csa.top}px`);
  root.style.setProperty("--tg-content-safe-area-bottom", `${csa.bottom}px`);
}

/**
 * Reads the Telegram WebApp initDataUnsafe to identify the user.
 * Falls back to a deterministic dev ID when running outside Telegram.
 * Initialises @tma.js/sdk for safe-area, viewport, and haptics.
 */
export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [ctx, setCtx] = useState<{
    telegramId: string | null;
    name: string | null;
    isReady: boolean;
    isTelegram: boolean;
  }>({
    telegramId: null,
    name: null,
    isReady: false,
    isTelegram: false,
  });

  const [safeArea, setSafeArea] = useState<SafeAreaInsets>(ZERO_INSETS);
  const [contentSafeArea, setContentSafeArea] = useState<SafeAreaInsets>(ZERO_INSETS);

  const getOrCreate = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    /* ── 1. Identify user from legacy WebApp object ── */
    const webapp = getTelegramWebApp();
    const tgUser = webapp?.initDataUnsafe?.user;

    let telegramId: string;
    let name: string;
    const isTelegram = !!tgUser;

    if (tgUser) {
      telegramId = String(tgUser.id);
      name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");

      webapp?.ready?.();
      webapp?.expand?.();

      try {
        webapp?.setHeaderColor?.("#0f0a1e");
        webapp?.setBackgroundColor?.("#0f0a1e");
      } catch {
        // some clients don't support this
      }
    } else {
      const stored = localStorage.getItem("rps_dev_telegram_id");
      if (stored) {
        telegramId = stored;
      } else {
        telegramId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem("rps_dev_telegram_id", telegramId);
      }
      name = "Dev Player";
    }

    setCtx({ telegramId, name, isReady: false, isTelegram });

    // Ensure user exists in DB
    getOrCreate({ telegramId, name }).then(() => {
      setCtx({ telegramId, name, isReady: true, isTelegram });
    });

    /* ── 2. Initialise @tma.js/sdk for viewport & safe areas ── */
    try {
      initTma();

      // Mount viewport (async)
      viewport.mount().then(() => {
        viewport.expand();
        viewport.bindCssVars();

        // Read initial safe area insets
        const readInsets = () => {
          try {
            const sa = viewport.safeAreaInsets();
            const csa = viewport.contentSafeAreaInsets();
            setSafeArea(sa);
            setContentSafeArea(csa);
            setSafeAreaCssVars(sa, csa);
          } catch {
            // Not available on this Telegram version
          }
        };

        readInsets();

        // Subscribe to changes (orientation, keyboard, etc.)
        try { viewport.safeAreaInsets.sub(readInsets); } catch { /* noop */ }
        try { viewport.contentSafeAreaInsets.sub(readInsets); } catch { /* noop */ }
      }).catch(() => {
        // viewport mount can fail outside Telegram
      });

      // Set Mini App colours via SDK
      try {
        tmaApp.mount();
        tmaApp.setHeaderColor("#0f0a1e");
        tmaApp.setBgColor("#0f0a1e");
      } catch {
        // ignore
      }
    } catch {
      // @tma.js/sdk init may fail outside Telegram — that's OK
      setSafeAreaCssVars(ZERO_INSETS, ZERO_INSETS);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Haptic helpers (use @tma.js/sdk with legacy fallback) ─── */
  const hapticImpact = useCallback((style: "light" | "medium" | "heavy" = "medium") => {
    try {
      tmaHaptic.impactOccurred(style);
    } catch {
      getTelegramWebApp()?.HapticFeedback?.impactOccurred(style);
    }
  }, []);

  const hapticNotification = useCallback((type: "success" | "error" | "warning") => {
    try {
      tmaHaptic.notificationOccurred(type);
    } catch {
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred(type);
    }
  }, []);

  const hapticSelection = useCallback(() => {
    try {
      tmaHaptic.selectionChanged();
    } catch {
      getTelegramWebApp()?.HapticFeedback?.selectionChanged();
    }
  }, []);

  /* ─── Back button helpers (use @tma.js/sdk with legacy fallback) ─── */
  const showBackButton = useCallback((onBack: () => void) => {
    try {
      if (tmaBackButton.isSupported()) {
        tmaBackButton.mount();
        tmaBackButton.show();
        tmaBackButton.onClick(onBack);
        return;
      }
    } catch { /* fallback */ }

    const bb = getTelegramWebApp()?.BackButton;
    if (!bb) return;
    bb.onClick(onBack);
    bb.show();
  }, []);

  const hideBackButton = useCallback(() => {
    try {
      if (tmaBackButton.isMounted()) {
        tmaBackButton.hide();
        return;
      }
    } catch { /* fallback */ }

    const bb = getTelegramWebApp()?.BackButton;
    if (!bb) return;
    bb.hide();
  }, []);

  const value: TelegramContextValue = {
    ...ctx,
    hapticImpact,
    hapticNotification,
    hapticSelection,
    showBackButton,
    hideBackButton,
    safeArea,
    contentSafeArea,
  };

  return (
    <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
  );
}
