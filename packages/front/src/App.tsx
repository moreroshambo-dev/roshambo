import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
// import { useServiceWorker } from "@/hooks/use-service-worker.ts";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ArenaLayout from "./pages/arena/_components/arena-layout.tsx";
import ArenaLobby from "./pages/arena/page.tsx";
import HistoryPage from "./pages/arena/history/page.tsx";
import LeaderboardPage from "./pages/arena/leaderboard/page.tsx";
import WalletPage from "./pages/arena/wallet/page.tsx";
import { GameRpsProvider } from "@/components/providers/rps.tsx";
import ReferralPage from "./pages/referral/page.tsx";
import InviteFriendsPage from "./pages/referral/invite/page.tsx";
import ReferralActivityPage from "./pages/referral/activity/page.tsx";
import ReferralLeaderboardPage from "./pages/referral/leaderboard/page.tsx";

export default function App() {
  // useServiceWorker();
  return (
    <BrowserRouter>
      <DefaultProviders>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<ArenaLayout />}>
            <Route path="/arena" element={<GameRpsProvider><ArenaLobby /></GameRpsProvider>} />
            <Route path="/arena/history" element={<HistoryPage />} />
            <Route path="/arena/leaderboard" element={<LeaderboardPage />} />
            <Route path="/arena/wallet" element={<WalletPage />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/referral/invite" element={<InviteFriendsPage />} />
            <Route path="/referral/activity" element={<ReferralActivityPage />} />
            <Route path="/referral/leaderboard" element={<ReferralLeaderboardPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </DefaultProviders>
    </BrowserRouter>
  );
}
