import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useTelegram } from "@/components/providers/telegram.tsx";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import {
  ArrowDownToLine,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Coins,
} from "lucide-react";

type DepositStatus = "pending" | "confirmed" | "failed" | "pending_review";

const STATUS_CONFIG: Record<DepositStatus, {
  label: string;
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
}> = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-neon-green",
    bg: "bg-neon-green/10",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-neon-blue",
    bg: "bg-neon-blue/10",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  pending_review: {
    label: "Review",
    icon: ShieldAlert,
    color: "text-neon-gold",
    bg: "bg-neon-gold/10",
  },
};

const TOKEN_ICONS: Record<string, string> = {
  TON: "💎",
  USDT: "💵",
  NOT: "🔔",
  DOGS: "🐕",
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function DepositHistory() {
  const deposits = useQuery(api.deposits.getMyDeposits);

  if (deposits === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (deposits.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ArrowDownToLine />
          </EmptyMedia>
          <EmptyTitle>No deposits yet</EmptyTitle>
          <EmptyDescription>
            Make your first deposit to top up your game balance
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-2">
      {deposits.map((deposit, i) => {
        const statusConf = STATUS_CONFIG[deposit.status as DepositStatus];
        const StatusIcon = statusConf?.icon ?? Clock;

        return (
          <motion.div
            key={deposit._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border/30"
          >
            {/* Token icon */}
            <div className="w-9 h-9 rounded-lg bg-background/60 flex items-center justify-center text-lg shrink-0">
              {TOKEN_ICONS[deposit.tokenType] ?? "💰"}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-display font-bold text-foreground tracking-wider">
                  {deposit.displayAmount} {deposit.tokenType}
                </span>
                <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full ${statusConf?.bg ?? ""} ${statusConf?.color ?? ""} font-display tracking-wider`}>
                  <StatusIcon className="size-2.5" />
                  {statusConf?.label ?? deposit.status}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                {deposit.txHash.slice(0, 16)}...
              </div>
            </div>

            {/* Credits */}
            <div className="text-right shrink-0">
              {deposit.status === "confirmed" ? (
                <div className="flex items-center gap-1 text-neon-green">
                  <Coins className="size-3" />
                  <span className="text-xs font-display font-bold tracking-wider">
                    +{deposit.creditedTokens.toLocaleString()}
                  </span>
                </div>
              ) : deposit.status === "pending" ? (
                <div className="flex items-center gap-1 text-neon-blue">
                  <Coins className="size-3" />
                  <span className="text-xs font-display tracking-wider">
                    ~{deposit.creditedTokens.toLocaleString()}
                  </span>
                </div>
              ) : null}
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {formatTime(deposit.initiatedAt)}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
