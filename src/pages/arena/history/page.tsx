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
import { Clock, Coins, Trophy, X as XIcon, Minus, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { FunctionReturnType } from "convex/server";
import { RPS_RESULT } from "@/convex/game/rcp/libs/rps";
import { RpsIcon } from "../_components/game/rps-icon";

type HistoryItem = FunctionReturnType<typeof api.game.rcp.history.get>[number]

export default function HistoryPage() {
  const history = useQuery(api.game.rcp.history.get);
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display font-bold text-lg tracking-[0.15em] text-foreground mb-1">
          MATCH HISTORY
        </h1>
        <p className="text-xs text-muted-foreground mb-6">
          Your last 50 completed matches
        </p>
      </motion.div>

      {history === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Clock />
            </EmptyMedia>
            <EmptyTitle>No matches yet</EmptyTitle>
            <EmptyDescription>
              Play your first match to see it here
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
          {history.map((match, index) => (
            <HistoryRow key={match._creationTime} match={match} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ match, index }: { match: HistoryItem; index: number }) {
  const date = new Date(match._creationTime);
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });

  const resultConfig = match.result === RPS_RESULT.WIN
    ? { label: "WIN", color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/20", icon: Trophy, sign: "+" }
    : match.result === RPS_RESULT.DRAW
      ? { label: "DRAW", color: "text-neon-gold", bg: "bg-neon-gold/10", border: "border-neon-gold/20", icon: Minus, sign: "" }
      : { label: "LOSS", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", icon: XIcon, sign: "-" };

  const tokenChange = match.result === RPS_RESULT.WIN
    ? `+${(match.betAmount * 2).toLocaleString()}`
    : match.result === RPS_RESULT.DRAW
      ? `+${match.betAmount.toLocaleString()}`
      : `-${match.betAmount.toLocaleString()}`;

  const Icon = resultConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={`rounded-xl ${resultConfig.bg} border ${resultConfig.border} backdrop-blur-md p-4 flex items-center gap-4`}
    >
      {/* Result icon */}
      <div className={`w-10 h-10 rounded-lg ${resultConfig.bg} border ${resultConfig.border} flex items-center justify-center shrink-0`}>
        <Icon className={`size-5 ${resultConfig.color}`} />
      </div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-display font-bold text-xs tracking-wider ${resultConfig.color}`}>
            {resultConfig.label}
          </span>
          <span className="text-muted-foreground text-xs">vs</span>
          <span className="text-foreground text-sm font-medium truncate">
            {match.opponentName}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{dateStr} {timeStr}</span>
          {match.myTurn && match.opponentTurn && (
            <span className=" inline-flex space-x-1">
              <RpsIcon choice={match.myTurn} size="text" className="inline-block"/>
               vs
              <RpsIcon choice={match.opponentTurn} size="text" className="inline-block"/>
            </span>
          )}
        </div>
      </div>

      {/* Token change */}
      <div className="text-right shrink-0">
        <div className={`font-display font-bold text-sm tracking-wider ${resultConfig.color} flex items-center gap-1 justify-end`}>
          <Coins className="size-3.5" />
          {tokenChange}
        </div>
        <div className="text-[10px] text-muted-foreground font-display tracking-wider">
          BET {match.betAmount.toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
}
