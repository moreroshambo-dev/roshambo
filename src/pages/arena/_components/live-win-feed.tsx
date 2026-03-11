import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import { Trophy, Coins, Flame } from "lucide-react";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function LiveWinFeed() {
  const recentWins = useQuery(api.matches.getRecentWins, {});

  if (recentWins === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (recentWins.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Trophy />
          </EmptyMedia>
          <EmptyTitle>No wins yet</EmptyTitle>
          <EmptyDescription>
            Be the first to win a match!
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {recentWins.map((win, i) => (
          <motion.div
            key={win._id}
            initial={{ opacity: 0, x: -30, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0, x: 30, height: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card/40 border border-border/25 hover:border-neon-gold/20 transition-colors"
          >
            {/* Win icon */}
            <div className="w-8 h-8 rounded-lg bg-neon-gold/10 border border-neon-gold/20 flex items-center justify-center shrink-0">
              <Flame className="size-4 text-neon-gold" />
            </div>

            {/* Winner info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-display font-bold text-foreground tracking-wider truncate max-w-[120px]">
                  {win.winnerName}
                </span>
                <span className="text-[9px] text-muted-foreground">won</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {timeAgo(win._creationTime)}
              </div>
            </div>

            {/* Payout */}
            <div className="flex items-center gap-1 shrink-0">
              <Coins className="size-3 text-neon-gold" />
              <span className="font-display font-bold text-sm text-neon-gold tracking-wider">
                +{win.payout.toLocaleString()}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
