import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useTelegram } from "@/components/providers/telegram.tsx";
import { ConvexError } from "convex/values";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Swords, Coins, Trophy, TrendingUp, Zap, Loader2, Radio } from "lucide-react";
import MyMatchCard from "./_components/my-match-card.tsx";
import LiveWinFeed from "./_components/live-win-feed.tsx";

const BET_PRESETS = [50, 100, 250, 500];

export default function ArenaLobby() {
  const { telegramId, hapticImpact } = useTelegram();
  const user = useQuery(api.users.getCurrentUser, telegramId ? { telegramId } : "skip");
  const myMatches = useQuery(api.matches.getMyMatches, telegramId ? { telegramId } : "skip");
  const quickStart = useMutation(api.matches.quickStart);
  const navigate = useNavigate();

  const [isStarting, setIsStarting] = useState<number | null>(null);

  const handleQuickStart = async (betAmount: number) => {
    hapticImpact("heavy");
    setIsStarting(betAmount);
    try {
      const result = await quickStart({ telegramId: telegramId!, betAmount });
      if (result.action === "joined") {
        toast.success("Opponent found! Game on!");
      } else {
        toast.success("Match created — waiting for opponent...");
      }
      navigate(`/arena/match/${result.matchId}`);
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to start match");
      }
    } finally {
      setIsStarting(null);
    }
  };

  // Filter my active matches (waiting or in_progress)
  const activeMatches = myMatches?.filter(
    (m) => m.status === "waiting" || m.status === "in_progress",
  );

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
            const isLoading = isStarting === preset;
            const canAfford = user ? (user.tokenBalance ?? 0) >= preset : true;
            return (
              <motion.button
                key={preset}
                whileHover={canAfford ? { scale: 1.04, y: -2 } : undefined}
                whileTap={canAfford ? { scale: 0.97 } : undefined}
                onClick={() => handleQuickStart(preset)}
                disabled={isStarting !== null || !canAfford}
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
            <span>Balance: {(user.tokenBalance ?? 0).toLocaleString()} tokens</span>
          </div>
        )}
      </motion.section>

      {/* My active matches */}
      {activeMatches && activeMatches.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6"
        >
          <h2 className="font-display font-bold text-sm tracking-[0.2em] text-neon-pink uppercase mb-3">
            Your Active Matches
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activeMatches.map((match) => (
              <MyMatchCard key={match._id} match={match} userId={user?._id} />
            ))}
          </div>
        </motion.section>
      )}

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
