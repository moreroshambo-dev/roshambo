import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTelegram } from "@/components/providers/telegram";
import { TURNS } from "./constants";
import { RPS_STAGES, type RpsTurn } from "@/convex/game/rcp/libs/rps";
import { toast } from "sonner";
import { AutoSelectToggle } from "./auto-select-toggle";
import { useGameRps } from "@/components/providers/rps";
import { useCountdown } from "@/hooks/use-countdown";
import { RpsIcon } from "./rps-icon";
import { Zap } from "lucide-react";

const useAutoSelect = () => {
  const match = useQuery(api.game.rcp.match.get)
  const submitTurn = useMutation(api.game.rcp.match.submitTurn)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {settings: {setAutoSelect, value: {autoSelectEnabled, autoSelectDuration}}} = useGameRps()
  const {hapticImpact} = useTelegram();
  const [autoChoiceRunning, setAutoChoiceRunning] = useState(false)
  const [cyclingIndex, setCyclingIndex] = useState<number>(0);
  const delay = 150;
  const countdown = useCountdown({startValue: autoSelectDuration / delay, running: autoChoiceRunning, delay})

  const handleCancelAutoSelect = useCallback(() => {
    setAutoSelect({enabled: false})
    setAutoChoiceRunning(false)
  }, [])

  const handleStartAutoSelect = useCallback(() => {
    setAutoChoiceRunning(true)
  }, [])

  const makeChoice = useCallback(async (turn: RpsTurn) => {
    if (isSubmitting && match?.stage === 'turn_wait') {
      return
    }

    hapticImpact("heavy");
    setIsSubmitting(true)

    try {
      await submitTurn({turn})
    } catch (error) {
      toast.error("Failed to submit choice");
    } finally {
      setIsSubmitting(false);
    }
  }, [])

  const handleMakeChoice = useCallback(async (turn: RpsTurn) => {
    handleCancelAutoSelect()
    makeChoice(turn)
  }, [])

  useEffect(() => {
    if (!autoChoiceRunning) {
      return
    }

    if (countdown > 300 / delay) {
      setCyclingIndex((cyclingIndex + Math.round(Math.random()) + 1) % TURNS.length);
      hapticImpact("light");
    } else if (countdown === 0) {
      makeChoice(TURNS[cyclingIndex].value)
    }
  }, [countdown, autoChoiceRunning, handleMakeChoice, autoSelectEnabled])

  useEffect(() => {
    if (autoSelectEnabled && match?.stage === RPS_STAGES.TURN_WAIT) {
      handleStartAutoSelect()
    }
  }, [autoSelectEnabled, match?.stage])

  return {
    autoChoiceRunning,
    handleCancelAutoSelect,
    handleStartAutoSelect,
    cyclingIndex,
    handleMakeChoice,
    isSubmitting,
    autoSelectDuration,
  }
}

type AutoSelectProgressPayload = {
  autoSelectDuration: number
}
function AutoSelectProgress(payload: AutoSelectProgressPayload) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2">
        <Zap className="size-4 text-neon-gold animate-pulse" />
        <span className="font-display text-xs tracking-wider text-neon-gold">
          AUTO-SELECTING...
        </span>
      </div>
      <div className="h-2 rounded-full bg-card/60 border border-neon-gold/30 overflow-hidden mx-4">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-neon-gold to-neon-pink"
          initial={{ width: "0%" }}
          animate={{ width: `100%` }}
          transition={{ duration: (payload.autoSelectDuration / 1000 - 0.3), ease: "linear" }}
        />
      </div>
    </div>
  )
}

function ChoiceSelectorTitle() {
  return (
    <div className="text-center">
      <span className="font-display text-xs tracking-[0.3em] text-neon-purple uppercase">
        Make Your Move
      </span>
    </div>
  )
}

export default function ChoiceSelector() {
  const {autoChoiceRunning, handleCancelAutoSelect, handleStartAutoSelect, cyclingIndex, handleMakeChoice, isSubmitting, autoSelectDuration} = useAutoSelect();
  const disabled = false

  const match = useQuery(api.game.rcp.match.get)

  return (
    <>
      {autoChoiceRunning ? <AutoSelectProgress autoSelectDuration={autoSelectDuration}/> : <ChoiceSelectorTitle/>}
      
      <div className="flex gap-3 justify-center">
        {TURNS.map((choice, index) => {
          const isSelected = match?.myTurn === choice.value;
          const isCycled = autoChoiceRunning && cyclingIndex === index;
          const isClickDisabled = disabled || !match || match.stage !== RPS_STAGES.TURN_WAIT;

          return (
            <motion.button
              key={choice.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              whileTap={isClickDisabled ? undefined : { scale: 0.92 }}
              onClick={() => !isClickDisabled && handleMakeChoice(choice.value)}
              disabled={isClickDisabled}
              className={`
                relative flex flex-col items-center justify-center gap-1.5
                w-[min(28vw,110px)] aspect-square rounded-2xl border-2
                backdrop-blur-md transition-all duration-150 cursor-pointer
                active:shadow-xl
                disabled:cursor-not-allowed
                ${
                  isCycled
                    ? "bg-neon-gold/20 border-neon-gold shadow-lg shadow-neon-gold/40 scale-105"
                    : isSelected
                      ? "bg-neon-purple/20 border-neon-purple shadow-lg shadow-neon-purple/30"
                      : autoChoiceRunning
                        ? "bg-card/30 border-border/20 opacity-50"
                        : "bg-card/60 border-border/40 active:border-neon-purple/50"
                }
              `}
              >
                <motion.span
                  className="text-4xl"
                  animate={isCycled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.15 }}
              >
                <RpsIcon
                  size="md"
                  choice={choice.value}
                />
              </motion.span>
              <span className="font-display text-[10px] tracking-wider text-foreground">
                {choice.label.toUpperCase()}
              </span>
              <div
                className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full transition-opacity duration-150 ${
                  isCycled
                    ? "bg-neon-gold opacity-100"
                    : isSelected
                      ? "bg-neon-purple opacity-100"
                      : "bg-neon-purple/40 opacity-0"
                }`}
              />
            </motion.button>
          );
        })}
      </div>

      <AutoSelectToggle
        isSubmitting={isSubmitting}
        autoChoiceRunning={autoChoiceRunning}
        handleCancelAutoSelect={handleCancelAutoSelect}
        handleStartAutoSelect={handleStartAutoSelect}
      />
    </>
  )
}
