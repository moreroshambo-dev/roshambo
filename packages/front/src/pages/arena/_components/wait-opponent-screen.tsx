import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Loader2, Coins, Users, Swords } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useGameRpsRoom } from "@/components/providers/rps";

const SEARCHING_MESSAGES = [
  "Scanning the arena...",
  "Looking for a worthy opponent...",
  "Matching skill levels...",
  "Almost there...",
];

export default function WaitingForOpponentScreen() {
  const {leaveRoom, isLeavingRoom, room} = useGameRpsRoom()
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Cycle through searching messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % SEARCHING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Main waiting card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="rounded-2xl bg-card/50 backdrop-blur-md border border-border/40 p-6 text-center space-y-6 relative overflow-hidden"
      >
        {/* Animated background pulse */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              opacity: [0.03, 0.08, 0.03],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] rounded-full bg-neon-purple/10 blur-[80px]"
          />
        </div>

        {/* Radar animation */}
        <div className="flex items-center justify-center">
          <div className="relative w-28 h-28">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-neon-purple/20" />
            {/* Middle ring */}
            <div className="absolute inset-3 rounded-full border border-neon-blue/15" />
            {/* Inner ring */}
            <div className="absolute inset-6 rounded-full border border-neon-purple/10" />
            {/* Sweep line */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left -translate-y-1/2 bg-gradient-to-r from-neon-purple to-transparent rounded-full"
            />

            {/* Center icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-black bg-gradient-to-br from-neon-purple/30 to-neon-blue/30 border border-neon-purple/30 flex items-center justify-center">
                <Users className="size-6 text-neon-purple" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-2 relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="font-display text-sm tracking-wider text-foreground"
            >
              {SEARCHING_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-1">
            <Loader2 className="size-3.5 text-neon-blue animate-spin" />
            <span className="font-display text-xs tracking-wider text-muted-foreground">
              SEARCHING
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 border border-border/30">
          <span className="text-[10px] text-muted-foreground font-display tracking-wider">
            ELAPSED
          </span>
          <span className="font-display font-bold text-sm tracking-wider text-neon-blue tabular-nums">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </motion.div>

      {/* Match info card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-card/30 backdrop-blur-md border border-border/30 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="size-4 text-neon-purple" />
            <span className="font-display text-xs tracking-wider text-muted-foreground">
              MATCH INFO
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl bg-card/40 border border-border/20 p-3 text-center">
            <Coins className="size-4 text-neon-gold mx-auto mb-1" />
            <span className="font-display font-bold text-lg tracking-wider text-neon-gold">
              {room?.betAmount}
            </span>
            <p className="text-[9px] text-muted-foreground font-display tracking-wider mt-0.5">
              BET AMOUNT
            </p>
          </div>
        </div>
      </motion.div>

      {/* Cancel button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={() => leaveRoom()}
          disabled={isLeavingRoom}
          className="w-full font-display tracking-wider text-xs bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/20 h-11 active:scale-[0.98] transition-transform"
        >
          {isLeavingRoom ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : null}
          {isLeavingRoom ? "CANCELLING..." : "CANCEL MATCH"}
        </Button>
      </motion.div>
    </div>
  );
}
