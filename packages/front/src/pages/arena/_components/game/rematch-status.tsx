import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useCountdown } from "@/hooks/use-countdown";

export function RematchStatus() {
  const match = useQuery(api.game.rcp.match.get)
  const myReady = match?.myReady || false
  const theirReady = match?.theirReady || false

  const countdown = useCountdown({startValue: match?.stageTimeLeftSeconds ?? 0, running: true})
  
  if (countdown > 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neon-blue/10 border border-neon-blue/20">
        <motion.span
          key={countdown}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-display font-black text-lg text-neon-blue"
        >
          {countdown}
        </motion.span>
        <span className="font-display text-xs tracking-wider text-neon-blue/80">
          NEXT ROUND
        </span>
      </div>
    );
  }

  if (myReady && !theirReady) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
        <Loader2 className="size-4 text-neon-purple animate-spin" />
        <span className="font-display text-xs tracking-wider text-neon-purple/80">
          WAITING FOR OPPONENT...
        </span>
      </div>
    );
  }

  if (myReady && theirReady) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neon-green/10 border border-neon-green/20">
        <Loader2 className="size-4 text-neon-green animate-spin" />
        <span className="font-display text-xs tracking-wider text-neon-green/80">
          STARTING...
        </span>
      </div>
    );
  }

  return null;
}
