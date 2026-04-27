import { Swords, Coins, Trophy, TrendingUp, Zap, Loader2, Radio } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import LiveWinFeed from "./live-win-feed.tsx";
import FreePlaySection from "./free-play-section.tsx";
import { useGameRps } from "@/components/providers/rps.tsx";
import ReferralBanner from "./referral-banner.tsx";

const BET_PRESETS = [50, 100, 250, 500];

export default function LobbyScreen() {
  const rps = useGameRps()
  const user = useQuery(api.users.getCurrentUser);
  const balance = useQuery(api.users.getBalance);
  const availableBalance = balance?.available ?? 0
  const lockedBalance = balance?.locked ?? 0;


  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5">
      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-3 gap-2 mb-6"
      >
        {user ? (
          <>
            <StatCard
              icon={<Trophy className="size-5 text-neon-gold" />}
              label="Wins"
              value={user.totalWins}
            />
            <StatCard
              icon={<TrendingUp className="size-5 text-neon-green" />}
              label="Win Rate"
              value={
                user.totalWins + user.totalLosses > 0
                  ? `${Math.round((user.totalWins / (user.totalWins + user.totalLosses)) * 100)}%`
                  : "—"
              }
            />
            <StatCard
              icon={<Swords className="size-5 text-neon-purple" />}
              label="Matches"
              value={user.totalWins + user.totalLosses + user.totalDraws}
            />
          </>
        ) : (
          <>
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </>
        )}
      </motion.div>

      <FreePlaySection/>

      {/* Quick start section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="size-4 text-neon-gold" />
          <h2 className="font-display font-bold text-sm tracking-[0.2em] text-neon-gold uppercase">
            Quick Start
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Pick a bet — instantly join or create a match.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {BET_PRESETS.map((preset) => {
            const isLoading = rps.isStarting === preset;
            const canAfford = user ? availableBalance >= preset : true;
            return (
              <motion.button
                key={preset}
                whileHover={canAfford ? { scale: 1.04, y: -2 } : undefined}
                whileTap={canAfford ? { scale: 0.97 } : undefined}
                onClick={() => rps.handleQuickStart(preset)}
                disabled={rps.isStarting !== null || !canAfford}
                className={`
                  relative flex flex-col items-center gap-1 py-3.5 px-1 rounded-xl border-2
                  backdrop-blur-md transition-all duration-300 cursor-pointer
                  active:scale-[0.97]
                  disabled:cursor-not-allowed
                  ${
                    isLoading
                      ? "bg-neon-purple/20 border-neon-purple shadow-lg shadow-neon-purple/30"
                      : canAfford
                        ? "bg-card/60 border-border/40 hover:border-neon-purple/50 hover:shadow-lg hover:shadow-neon-purple/10"
                        : "bg-card/30 border-border/20 opacity-50"
                  }
                `}
              >
                {isLoading ? (
                  <Loader2 className="size-5 text-neon-purple animate-spin" />
                ) : (
                  <Coins className="size-5 text-neon-gold" />
                )}
                <span className="font-display font-bold text-lg tracking-wider text-foreground">
                  {preset}
                </span>
                <span className="text-[9px] text-muted-foreground font-display tracking-wider uppercase">
                  {isLoading ? "Finding..." : "Tokens"}
                </span>
              </motion.button>
            );
          })}
        </div>
        {user && (
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
            <Coins className="size-3 text-neon-gold" />
            <span>Balance: {availableBalance.toLocaleString()} tokens</span>
            {lockedBalance > 0 && <span className="text-[11px] text-muted-foreground">Locked: {lockedBalance.toLocaleString()}</span>}
          </div>
        )}
      </motion.section>

      <ReferralBanner/>

      {/* Live win feed */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Radio className="size-4 text-neon-green" />
          <h2 className="font-display font-bold text-sm tracking-[0.2em] text-neon-green uppercase">
            Live Wins
          </h2>
          <div className="relative flex items-center ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
            <span className="absolute w-1.5 h-1.5 rounded-full bg-neon-green animate-ping" />
          </div>
        </div>
        <LiveWinFeed />
      </motion.section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-card/50 backdrop-blur-md border border-border/40 p-4 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <div className="font-display font-bold text-xl text-foreground tracking-wider">
        {value}
      </div>
      <div className="text-muted-foreground text-xs tracking-wider uppercase mt-0.5">
        {label}
      </div>
    </div>
  );
}
