import { ConvexProvider } from "./convex.tsx";
import { TelegramProvider } from "./telegram.tsx";
import { TonConnectProvider } from "./ton-connect.tsx";
import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <ConvexProvider>
        <TonConnectProvider>
          <QueryClientProvider>
            <TooltipProvider>
              <ThemeProvider>
                <Toaster />
                {children}
              </ThemeProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </TonConnectProvider>
      </ConvexProvider>
    </TelegramProvider>
  );
}
