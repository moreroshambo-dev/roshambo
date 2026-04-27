import { motion } from "motion/react";
import { Timer } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useCountdown } from "@/hooks/use-countdown";

const MATCH_TIMER_SECONDS = 30

export type ChoiceTimerPayload = {
  start: number
  running: boolean
  hidden?: boolean
}


export function ChoiceTimer(
  payload: ChoiceTimerPayload
) {
  const matchTimer = useCountdown({startValue: payload.start, running: payload.running})
  const timerPercent = (matchTimer / MATCH_TIMER_SECONDS) * 100;
  const isUrgent = matchTimer <= 10;

  if (payload.hidden) {
    return (
      <div className="h-10.5"/>
    )
  }

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Timer className={`size-3.5 ${isUrgent ? "text-destructive" : "text-neon-blue"}`} />
          <span className={`font-display text-xs tracking-wider ${isUrgent ? "text-destructive" : "text-neon-blue/80"}`}>
            TIMER
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={matchTimer}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`font-display font-black text-lg tabular-nums ${isUrgent ? "text-destructive" : "text-neon-blue"}`}
          >
            {matchTimer}s
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="h-1.5 rounded-full bg-card/60 border border-border/30 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isUrgent ? "bg-destructive" : "bg-gradient-to-r from-neon-blue to-neon-purple"}`}
          initial={false}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 0.3, ease: "linear" }}
        />
      </div>
    </div>
  )
}