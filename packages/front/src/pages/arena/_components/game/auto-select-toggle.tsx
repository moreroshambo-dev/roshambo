import { useGameRps } from "@/components/providers/rps";
import { Button } from "@/components/ui/button";
import { Zap, ZapOff } from "lucide-react";
import { motion } from "motion/react";

export function AutoSelectToggle({autoChoiceRunning, handleCancelAutoSelect, isSubmitting, handleStartAutoSelect}:{
  autoChoiceRunning: boolean,
  isSubmitting: boolean,
  handleCancelAutoSelect: () => void,
  handleStartAutoSelect: () => void,
}) {
  const {
    settings: {toggle, value: {autoSelectEnabled}},
  } = useGameRps()
  
  if (autoChoiceRunning) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        {/* Cancel button — stop auto-choice and switch back to manual */}
        <Button
          onClick={handleCancelAutoSelect}
          className="w-full font-display tracking-wider text-xs bg-destructive/20 text-destructive hover:bg-destructive/30 border-0 h-9 active:scale-[0.98] transition-transform"
        >
          <ZapOff className="size-3.5 mr-1.5" />
          CANCEL AUTO
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex gap-2"
    >
      {/* Toggle auto-select on/off */}
      <Button
        onClick={toggle}
        className={`flex-1 font-display tracking-wider text-xs border-0 h-10 active:scale-[0.98] transition-transform ${
          autoSelectEnabled
            ? "bg-neon-gold/20 text-neon-gold hover:bg-neon-gold/30"
            : "bg-card/60 text-muted-foreground hover:bg-card/80"
        }`}
      >
        {autoSelectEnabled ? (
          <Zap className="size-4 mr-1.5" />
        ) : (
          <ZapOff className="size-4 mr-1.5" />
        )}
        AUTO: {autoSelectEnabled ? "ON" : "OFF"}
      </Button>

      {/* One-time trigger (if auto not enabled) */}
      {!autoSelectEnabled && (
        <Button
          onClick={handleStartAutoSelect}
          disabled={isSubmitting}
          className="flex-1 font-display tracking-wider text-xs bg-linear-to-r from-neon-gold/70 to-neon-pink/70 hover:from-neon-gold/90 hover:to-neon-pink/90 border-0 h-10 active:scale-[0.98] transition-transform"
        >
          <Zap className="size-4 mr-1.5" />
          RANDOM
        </Button>
      )}
    </motion.div>
  );
}
