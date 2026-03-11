import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Coins, X, Loader2, Swords } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "@/components/providers/telegram.tsx";

type MyMatch = {
  _id: Id<"matches">;
  creatorId: Id<"users">;
  betAmount: number;
  status: "waiting" | "in_progress" | "completed" | "cancelled";
  creatorName: string;
  opponentName: string | null;
  isCreator: boolean;
};

export default function MyMatchCard({
  match,
  userId,
}: {
  match: MyMatch;
  userId?: Id<"users">;
}) {
  const cancelMatch = useMutation(api.matches.cancelMatch);
  const [isCancelling, setIsCancelling] = useState(false);
  const navigate = useNavigate();
  const { telegramId } = useTelegram();

  const handleCancel = async () => {
    if (!telegramId) return;
    setIsCancelling(true);
    try {
      await cancelMatch({ telegramId, matchId: match._id });
      toast.success("Match cancelled. Tokens refunded.");
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to cancel match");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const opponentLabel = match.isCreator
    ? match.opponentName ?? "Waiting..."
    : match.creatorName;

  return (
    <div className="rounded-xl bg-card/50 backdrop-blur-md border border-border/40 p-4 flex flex-col gap-3">
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <StatusBadge status={match.status} />
        <div className="flex items-center gap-1.5">
          <Coins className="size-3.5 text-neon-gold" />
          <span className="font-display font-bold text-sm tracking-wider text-neon-gold">
            {match.betAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Matchup */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium truncate max-w-[40%]">
          {match.isCreator ? "You" : match.creatorName}
        </span>
        <span className="text-muted-foreground font-display text-xs">VS</span>
        <span className="text-foreground font-medium truncate max-w-[40%] text-right">
          {match.isCreator
            ? match.opponentName ?? "..."
            : "You"}
        </span>
      </div>

      {/* Action buttons */}
      {match.status === "waiting" && match.isCreator && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isCancelling}
          className="w-full font-display tracking-wider text-xs text-destructive hover:text-destructive"
        >
          <X className="size-3.5 mr-1" />
          {isCancelling ? "CANCELLING..." : "CANCEL MATCH"}
        </Button>
      )}

      {match.status === "waiting" && !match.isCreator && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
          <Loader2 className="size-3.5 animate-spin" />
          <span className="font-display tracking-wider">WAITING FOR CREATOR</span>
        </div>
      )}

      {match.status === "in_progress" && (
        <Button
          size="sm"
          onClick={() => navigate(`/arena/match/${match._id}`)}
          className="w-full font-display tracking-wider text-xs bg-gradient-to-r from-neon-green to-neon-blue hover:opacity-90 border-0"
        >
          <Swords className="size-3.5 mr-1" />
          PLAY NOW
        </Button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    waiting: {
      label: "WAITING",
      className: "bg-neon-gold/10 text-neon-gold border-neon-gold/20",
    },
    in_progress: {
      label: "IN PROGRESS",
      className: "bg-neon-green/10 text-neon-green border-neon-green/20",
    },
    completed: {
      label: "COMPLETED",
      className: "bg-muted text-muted-foreground border-border/30",
    },
    cancelled: {
      label: "CANCELLED",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const { label, className } = config[status] ?? config.waiting;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-display tracking-wider border ${className}`}
    >
      {label}
    </span>
  );
}
