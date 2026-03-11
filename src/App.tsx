import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import { useServiceWorker } from "@/hooks/use-service-worker.ts";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ArenaLayout from "./pages/arena/_components/arena-layout.tsx";
import ArenaLobby from "./pages/arena/page.tsx";
import MatchPage from "./pages/arena/match/page.tsx";
import HistoryPage from "./pages/arena/history/page.tsx";
import LeaderboardPage from "./pages/arena/leaderboard/page.tsx";
import WalletPage from "./pages/arena/wallet/page.tsx";

export default function App() {
  useServiceWorker();
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<ArenaLayout />}>
            <Route path="/arena" element={<ArenaLobby />} />
            <Route path="/arena/history" element={<HistoryPage />} />
            <Route path="/arena/leaderboard" element={<LeaderboardPage />} />
            <Route path="/arena/wallet" element={<WalletPage />} />
            <Route path="/arena/match/:matchId" element={<MatchPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
