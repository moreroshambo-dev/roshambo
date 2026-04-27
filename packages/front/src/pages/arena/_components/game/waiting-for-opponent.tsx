import { motion } from "motion/react";
import { TURNS } from "./constants";
import { Check, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RpsIcon } from "./rps-icon";

export function WaitingForOpponent() {
  const match = useQuery(api.game.rcp.match.get)
  const choiceData = TURNS.find((c) => c.value === match?.myTurn);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl bg-card/50 backdrop-blur-md border border-border/40 p-6 text-center space-y-4"
    >
      {choiceData && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-purple/15 border border-neon-purple/30"
        >
          <Check className="size-4 text-neon-green" />
          <RpsIcon
            size="md"
            choice={choiceData.value}
          />
          <span className="font-display text-sm tracking-wider text-foreground">
            {choiceData.label.toUpperCase()}
          </span>
        </motion.div>
      )}

      <div className="space-y-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          <Loader2 className="size-7 text-neon-blue" />
        </motion.div>
        <p className="font-display text-sm tracking-wider text-muted-foreground">
          WAITING FOR OPPONENT
        </p>
        <p className="text-xs text-muted-foreground/60">
          Your choice is locked in. The match will resolve when both players choose.
        </p>
      </div>
    </motion.div>
  );
}