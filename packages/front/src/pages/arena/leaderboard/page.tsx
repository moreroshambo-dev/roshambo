import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Crown, Coins, TrendingUp, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LeaderboardPage() {
  const leaderboard = useQuery(api.matches.getLeaderboard, {});
  const currentUser = useQuery(api.users.getCurrentUser);
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display font-bold text-lg tracking-[0.15em] text-foreground mb-1">
          DAILY LEADERBOARD
        </h1>
        <p className="text-xs text-muted-foreground mb-6">
          Top players ranked by today{"'"}s balance multiplier (X)
        </p>
      </motion.div>

      {leaderboard === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Crown />
            </EmptyMedia>
            <EmptyTitle>No one played today</EmptyTitle>
            <EmptyDescription>
              Be the first to play and top the leaderboard
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              size="sm"
              onClick={() => navigate("/arena")}
              className="font-display tracking-wider text-xs bg-gradient-to-r from-neon-purple to-neon-blue hover:opacity-90 border-0"
            >
              <Swords className="size-3.5 mr-1" />
              PLAY NOW
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <LeaderboardRow
              key={entry._id}
              entry={entry}
              rank={index + 1}
              isMe={currentUser?._id === entry._id}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type LeaderboardEntry = {
  _id: string;
  name: string;
  tokenBalance: number;
  totalWins: number;
  totalLosses: number;
  multiplier: number;
  playedToday: boolean;
};

function LeaderboardRow({
  entry,
  rank,
  isMe,
  index,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isMe: boolean;
  index: number;
}) {
  const isTop3 = rank <= 3;
  const rankColors: Record<number, string> = {
    1: "from-neon-gold to-neon-gold/60 text-neon-gold",
    2: "from-gray-300 to-gray-400 text-gray-300",
    3: "from-amber-700 to-amber-600 text-amber-600",
  };

  const multiplierColor =
    entry.multiplier >= 2
      ? "text-neon-green"
      : entry.multiplier >= 1
        ? "text-neon-gold"
        : "text-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`
        rounded-xl backdrop-blur-md p-4 flex items-center gap-4
        ${isMe ? "bg-neon-purple/10 border-2 border-neon-purple/30" : "bg-card/50 border border-border/40"}
        ${isTop3 ? "shadow-lg" : ""}
      `}
    >
      {/* Rank */}
      <div className="shrink-0 w-10 text-center">
        {isTop3 ? (
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${rankColors[rank] ?? ""} flex items-center justify-center`}>
            {rank === 1 ? (
              <Crown className="size-5 text-background" />
            ) : (
              <span className="font-display font-black text-lg text-background">{rank}</span>
            )}
          </div>
        ) : (
          <span className="font-display font-bold text-lg text-muted-foreground">{rank}</span>
        )}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium truncate ${isMe ? "text-neon-purple" : "text-foreground"}`}>
            {entry.name}
          </span>
          {isMe && (
            <span className="text-[10px] font-display tracking-wider text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Coins className="size-3" />
            {entry.tokenBalance.toLocaleString()}
          </span>
          <span>
            W{entry.totalWins} / L{entry.totalLosses}
          </span>
        </div>
      </div>

      {/* Multiplier */}
      <div className="text-right shrink-0">
        <div className={`font-display font-black text-xl tracking-wider ${multiplierColor} flex items-center gap-1 justify-end`}>
          <TrendingUp className="size-4" />
          {entry.multiplier}x
        </div>
        <div className="text-[10px] text-muted-foreground font-display tracking-wider">
          TODAY
        </div>
      </div>
    </motion.div>
  );
}
