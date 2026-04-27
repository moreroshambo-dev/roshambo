import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Coins, Swords, Clock, Crown, Wallet, Loader2 } from "lucide-react";
import { useTelegram } from "@/components/providers/telegram.tsx";
import { motion } from "motion/react";
import ReferralIcon from "@/components/layout/ReferralIcon";

const BOTTOM_TABS = [
  { path: "/arena", label: "Lobby", icon: Swords },
  { path: "/arena/history", label: "History", icon: Clock },
  { path: "/arena/leaderboard", label: "Top", icon: Crown },
  { path: "/arena/wallet", label: "Wallet", icon: Wallet },
] as const;

/* ─── Compact top bar showing balance ─── */
function TopBar() {
  const user = useQuery(api.users.getCurrentUser);
  const balance = useQuery(api.users.getBalance);

  return (
    <header
      className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/20"
      style={{ 
        paddingTop: "var(--tg-safe-area-inset-top, 0px)",
      }}
    >
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-white font-display font-bold text-[10px]">
            R
          </div>
          <span className="font-display font-bold text-xs tracking-[0.15em] text-foreground">
            RPS ARENA
          </span>
        </div>

        {/* Balance pill + player name */}
        <div className="flex items-center gap-2">
          {user && balance ? (
            <>
              <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[100px]">
                {user.name ?? "Player"}
              </span>

              <ReferralIcon/>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon-gold/10 border border-neon-gold/20">
                <Coins className="size-3.5 text-neon-gold" />
                <span className="font-display font-bold text-xs text-neon-gold tracking-wider">
                  {(balance.available + balance.locked).toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <Skeleton className="h-7 w-24 rounded-full" />
          )}
        </div>
      </div>
    </header>
  );
}

/* ─── Bottom tab bar (mobile-native feel) ─── */
function BottomTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticSelection } = useTelegram();

  // Don't show tabs on match pages
  const isMatchPage = location.pathname.includes("/arena/match/");
  if (isMatchPage) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/30"
      style={{ paddingBottom: "var(--tg-safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch">
        {BOTTOM_TABS.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => {
                hapticSelection();
                navigate(tab.path);
              }}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors cursor-pointer
                ${isActive ? "text-neon-purple" : "text-muted-foreground"}
              `}
            >
              <Icon className={`size-5 ${isActive ? "text-neon-purple" : ""}`} />
              <span className={`font-display text-[10px] tracking-[0.1em] ${isActive ? "text-neon-purple font-bold" : ""}`}>
                {tab.label.toUpperCase()}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomTabIndicator"
                  className="absolute top-0 left-0 right-0 h-0.5 bg-neon-purple"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ─── Loading splash ─── */
function LoadingSplash() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-xl shadow-neon-purple/20"
      >
        <span className="text-white font-display font-black text-2xl">R</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-2"
      >
        <span className="font-display font-bold text-sm tracking-[0.2em] text-foreground">
          RPS ARENA
        </span>
        <Loader2 className="size-5 text-neon-purple animate-spin" />
      </motion.div>
    </div>
  );
}

/* ─── Main layout ─── */
export default function ArenaLayout() {
  const isReady = true

  return (
    <div
      className="min-h-screen bg-background relative"
      style={{
        paddingLeft: "var(--tg-safe-area-inset-left, 0px)",
        paddingRight: "var(--tg-safe-area-inset-right, 0px)",
      }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[40%] h-[40%] rounded-full bg-neon-purple/4 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-neon-blue/4 blur-[100px]" />
      </div>

      {!isReady ? (
        <LoadingSplash />
      ) : (
        <>
          <TopBar />
          <main className="relative z-10 pb-20">
            <Outlet />
          </main>
          <BottomTabs />
        </>
      )}
    </div>
  );
}
