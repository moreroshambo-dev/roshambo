import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import ChoiceSelector from "./choice-selector";
import { PlayerHeader } from "./player-header";
import { WaitingForOpponent } from "./waiting-for-opponent";
import { ResultReveal } from "./result-reveal";
import { RematchStatus } from "./rematch-status";
import ChangeOpponentButton from "./change-opponent-button";
import { ChoiceTimer } from "./choice-timer";
import { RPS_STAGES } from "@/convex/game/rcp/libs/rps";

export default function GameScreen() {
  const match = useQuery(api.game.rcp.match.get)
  const isCompleted = match?.stage === 'turn_resolved';

  return (
    <div className="space-y-5">
      <PlayerHeader />

      {match?.stage !== RPS_STAGES.TURN_RESOLVED && <ChoiceTimer
        start={match?.stageTimeLeftSeconds ?? 0}
        running={match?.stage === RPS_STAGES.TURN_WAIT}
        hidden={match?.stage !== RPS_STAGES.TURN_WAIT}
      />}

      {match?.stage === RPS_STAGES.TURN_WAIT && (match?.myTurn ? <WaitingForOpponent /> : <ChoiceSelector/>)}
      {match?.stage === RPS_STAGES.TURN_SUBMIT && <WaitingForOpponent />}
      {match?.stage === RPS_STAGES.TURN_RESOLVED && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="space-y-2.5"
        >
          <ResultReveal/>
  
          <RematchStatus />

          <ChangeOpponentButton />
        </motion.div>
      )}

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-2 py-4"
        >
          <Loader2 className="size-6 text-neon-blue animate-spin" />
          <p className="font-display text-sm tracking-wider text-neon-blue">
            STARTING NEXT ROUND...
          </p>
        </motion.div>
      )}
    </div>
  );
}
