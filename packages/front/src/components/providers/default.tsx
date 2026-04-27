import { ConvexProvider } from "./convex.tsx";
import { TelegramProvider } from "./telegram.tsx";
import { TonConnectProvider } from "./ton-connect.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";
import { TelegramAuth } from "./auth.tsx";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <ConvexProvider>
        <TelegramAuth>
          <TonConnectProvider>
            <TooltipProvider>
              <ThemeProvider>
                <Toaster />
                {children}
              </ThemeProvider>
            </TooltipProvider>
          </TonConnectProvider>
        </TelegramAuth>
      </ConvexProvider>
    </TelegramProvider>
  );
}
