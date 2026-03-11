import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useTelegram } from "@/components/providers/telegram.tsx";
import { ConvexError } from "convex/values";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Coins, Trophy, Check, Loader2, User, ArrowLeft, Shuffle, Zap, Timer, ZapOff } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type Choice = "rock" | "paper" | "scissors";

const CHOICES: { value: Choice; emoji: string; label: string }[] = [
  { value: "rock", emoji: "🪨", label: "Rock" },
  { value: "paper", emoji: "📄", label: "Paper" },
  { value: "scissors", emoji: "✂️", label: "Scissors" },
];

const MATCH_TIMER_SECONDS = 30;
const AUTO_SELECT_KEY = "rps_auto_select";

/** Read persistent auto-select preference */
function getAutoSelectPref(): boolean {
  try {
    return localStorage.getItem(AUTO_SELECT_KEY) === "true";
  } catch {
    return false;
  }
}

/** Save persistent auto-select preference */
function setAutoSelectPref(enabled: boolean) {
  try {
    localStorage.setItem(AUTO_SELECT_KEY, String(enabled));
  } catch {
    // ignore
  }
}

type MatchData = {
  _id: Id<"matches">;
  betAmount: number;
  status: string;
  result?: string;
  winnerId?: Id<"users">;
  creatorName: string;
  opponentName: string | null;
  creatorId: Id<"users">;
  opponentId?: Id<"users">;
  isCreator: boolean;
  isOpponent: boolean;
  isParticipant: boolean;
  myChoice?: Choice;
  opponentChoice?: Choice;
  creatorChoice?: Choice;
  opponentChoiceRaw?: Choice;
  // Rematch fields
  creatorRematchReady: boolean;
  opponentRematchReady: boolean;
  nextMatchId?: Id<"matches">;
  splitCreatorMatchId?: Id<"matches">;
  splitOpponentMatchId?: Id<"matches">;
};

const REMATCH_DELAY_SECONDS = 3;

export default function GameScreen({ match }: { match: MatchData }) {
  const makeChoice = useMutation(api.matches.makeChoice);
  const signalRematch = useMutation(api.matches.signalRematchReady);
  const changeOpponentMut = useMutation(api.matches.changeOpponent);
  const navigate = useNavigate();
  const { telegramId, hapticImpact, hapticNotification } = useTelegram();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);

  // Auto-rematch state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [rematchCancelled, setRematchCancelled] = useState(false);
  const hasSignaledRef = useRef(false);
  const [isChangingOpponent, setIsChangingOpponent] = useState(false);

  // Match timer state (30 seconds)
  const [matchTimer, setMatchTimer] = useState(MATCH_TIMER_SECONDS);
  const matchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistent auto-select toggle
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(getAutoSelectPref);

  // Auto-choice animation state
  const [autoChoiceRunning, setAutoChoiceRunning] = useState(false);
  const [autoChoiceTimer, setAutoChoiceTimer] = useState(0);
  const [cyclingIndex, setCyclingIndex] = useState(0);
  const autoChoiceRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoChoiceSubmittedRef = useRef(false);
  // Tracks whether auto-start already fired for this match
  const autoStartFiredRef = useRef(false);

  const myName = match.isCreator ? match.creatorName : match.opponentName ?? "You";
  const theirName = match.isCreator
    ? match.opponentName ?? "Opponent"
    : match.creatorName;
  const totalPot = match.betAmount * 2;

  const isCompleted = match.status === "completed";
  const didWin = isCompleted && match.winnerId != null && (
    (match.isCreator && match.result === "creator_win") ||
    (match.isOpponent && match.result === "opponent_win")
  );
  const didLose = isCompleted && match.winnerId != null && !didWin;
  const isDraw = isCompleted && match.result === "draw";

  const isTransitioning = !!match.nextMatchId || !!match.splitCreatorMatchId || !!match.splitOpponentMatchId;

  const hasChosen = !!match.myChoice || !!selectedChoice;
  const isInProgress = match.status === "in_progress";

  // Cancel a running auto-choice animation (stops cycling, returns to manual)
  const cancelAutoChoice = useCallback(() => {
    if (autoChoiceRef.current) { clearInterval(autoChoiceRef.current); autoChoiceRef.current = null; }
    setAutoChoiceRunning(false);
    setAutoChoiceTimer(0);
    setCyclingIndex(0);
    autoChoiceSubmittedRef.current = true; // prevent re-trigger
  }, []);

  // Toggle auto-select persistent setting
  const toggleAutoSelect = useCallback(() => {
    setAutoSelectEnabled((prev) => {
      const next = !prev;
      setAutoSelectPref(next);
      // If turning OFF while animation is running → cancel it
      if (!next) {
        cancelAutoChoice();
      }
      return next;
    });
  }, [cancelAutoChoice]);

  // Haptic on result
  useEffect(() => {
    if (!isCompleted) return;
    if (didWin) hapticNotification("success");
    else if (didLose) hapticNotification("error");
    else if (isDraw) hapticNotification("warning");
  }, [isCompleted, didWin, didLose, isDraw, hapticNotification]);

  // Reset per-match state when match changes
  useEffect(() => {
    setSelectedChoice(null);
    setIsSubmitting(false);
    setCountdown(null);
    setRematchCancelled(false);
    hasSignaledRef.current = false;
    setIsChangingOpponent(false);
    setMatchTimer(MATCH_TIMER_SECONDS);
    setAutoChoiceRunning(false);
    setAutoChoiceTimer(0);
    setCyclingIndex(0);
    autoChoiceSubmittedRef.current = false;
    autoStartFiredRef.current = false;
    if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    if (autoChoiceRef.current) clearInterval(autoChoiceRef.current);
  }, [match._id]);

  // Submit choice handler
  const handleMakeChoice = useCallback(async (choice: Choice) => {
    if (match.myChoice || isSubmitting || selectedChoice) return;
    hapticImpact("heavy");
    setSelectedChoice(choice);
    setIsSubmitting(true);
    // Stop animation and match timer
    setAutoChoiceRunning(false);
    if (autoChoiceRef.current) { clearInterval(autoChoiceRef.current); autoChoiceRef.current = null; }
    if (matchTimerRef.current) { clearInterval(matchTimerRef.current); matchTimerRef.current = null; }
    try {
      await makeChoice({ telegramId: telegramId!, matchId: match._id, choice });
    } catch (error) {
      setSelectedChoice(null);
      hapticNotification("error");
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to submit choice");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [match.myChoice, match._id, isSubmitting, selectedChoice, hapticImpact, hapticNotification, makeChoice, telegramId]);

  // 3-second cycling animation → random pick
  const startAutoChoiceAnimation = useCallback(() => {
    if (hasChosen || isSubmitting || autoChoiceRunning) return;
    hapticImpact("medium");
    setAutoChoiceRunning(true);
    setAutoChoiceTimer(3000);
    autoChoiceSubmittedRef.current = false;

    let elapsed = 0;
    const TICK = 100;
    let idx = 0;

    autoChoiceRef.current = setInterval(() => {
      elapsed += TICK;
      setAutoChoiceTimer(Math.max(0, 3000 - elapsed));

      // Cycle: fast → slow
      const cycleSpeed = elapsed < 2000 ? 150 : elapsed < 2500 ? 250 : 400;
      if (elapsed % cycleSpeed < TICK) {
        idx = (idx + 1) % 3;
        setCyclingIndex(idx);
      }

      if (elapsed >= 3000) {
        if (autoChoiceRef.current) { clearInterval(autoChoiceRef.current); autoChoiceRef.current = null; }
        const finalIdx = Math.floor(Math.random() * 3);
        setCyclingIndex(finalIdx);
        const finalChoice = CHOICES[finalIdx].value;
        if (!autoChoiceSubmittedRef.current) {
          autoChoiceSubmittedRef.current = true;
          setTimeout(() => {
            handleMakeChoice(finalChoice);
          }, 300);
        }
      }
    }, TICK);
  }, [hasChosen, isSubmitting, autoChoiceRunning, hapticImpact, handleMakeChoice]);

  // Auto-start: when auto-select is ON, start animation on match begin (with 1s delay)
  useEffect(() => {
    if (!autoSelectEnabled || !isInProgress || hasChosen || autoChoiceRunning || autoStartFiredRef.current) return;
    autoStartFiredRef.current = true;
    // Small delay so the player sees the screen before cycling starts
    const t = setTimeout(() => {
      startAutoChoiceAnimation();
    }, 800);
    return () => clearTimeout(t);
  }, [autoSelectEnabled, isInProgress, hasChosen, autoChoiceRunning, startAutoChoiceAnimation]);

  // Match timer: 30 seconds countdown
  useEffect(() => {
    if (!isInProgress || hasChosen || isCompleted) {
      if (matchTimerRef.current) { clearInterval(matchTimerRef.current); matchTimerRef.current = null; }
      return;
    }

    setMatchTimer(MATCH_TIMER_SECONDS);
    matchTimerRef.current = setInterval(() => {
      setMatchTimer((prev) => {
        if (prev <= 1) {
          if (matchTimerRef.current) { clearInterval(matchTimerRef.current); matchTimerRef.current = null; }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (matchTimerRef.current) { clearInterval(matchTimerRef.current); matchTimerRef.current = null; }
    };
  }, [isInProgress, hasChosen, isCompleted, match._id]);

  // Timer expired → force auto-choice regardless of toggle
  useEffect(() => {
    if (matchTimer === 0 && isInProgress && !hasChosen && !autoChoiceRunning && !autoChoiceSubmittedRef.current) {
      startAutoChoiceAnimation();
    }
  }, [matchTimer, isInProgress, hasChosen, autoChoiceRunning, startAutoChoiceAnimation]);

  // Start rematch countdown when match completes
  useEffect(() => {
    if (!isCompleted || isTransitioning) return;
    setCountdown(REMATCH_DELAY_SECONDS);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, match._id, isTransitioning]);

  // Signal rematch when countdown reaches 0
  useEffect(() => {
    if (countdown !== 0 || hasSignaledRef.current || rematchCancelled || isTransitioning) return;
    hasSignaledRef.current = true;
    signalRematch({ telegramId: telegramId!, matchId: match._id });
  }, [countdown, rematchCancelled, isTransitioning, signalRematch, telegramId, match._id]);

  const handleChangeOpponent = async () => {
    setRematchCancelled(true);
    hapticImpact("medium");
    setIsChangingOpponent(true);
    try {
      const newMatchId = await changeOpponentMut({ telegramId: telegramId!, matchId: match._id });
      if (newMatchId) {
        navigate(`/arena/match/${newMatchId}`, { replace: true });
      } else {
        toast.error("Not enough tokens to change opponent");
      }
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to change opponent");
      }
    } finally {
      setIsChangingOpponent(false);
    }
  };

  const myReady = match.isCreator ? match.creatorRematchReady : match.opponentRematchReady;
  const theirReady = match.isCreator ? match.opponentRematchReady : match.creatorRematchReady;

  return (
    <div className="space-y-5">
      {/* Players & pot header */}
      <PlayerHeader
        myName={myName}
        theirName={theirName}
        totalPot={totalPot}
        betAmount={match.betAmount}
        autoSelectEnabled={autoSelectEnabled}
        onToggleAutoSelect={toggleAutoSelect}
      />

      {/* Game area */}
      {isCompleted ? (
        <ResultReveal
          match={match}
          didWin={didWin}
          didLose={didLose}
          isDraw={isDraw}
          totalPot={totalPot}
        />
      ) : hasChosen ? (
        <WaitingForOpponent myChoice={match.myChoice ?? selectedChoice} />
      ) : (
        <ChoiceSelector
          onSelect={handleMakeChoice}
          isSubmitting={isSubmitting}
          selectedChoice={selectedChoice}
          matchTimer={matchTimer}
          autoChoiceRunning={autoChoiceRunning}
          autoChoiceTimer={autoChoiceTimer}
          cyclingIndex={cyclingIndex}
          autoSelectEnabled={autoSelectEnabled}
          onToggleAutoSelect={toggleAutoSelect}
          onManualAutoChoice={startAutoChoiceAnimation}
          onCancelAutoChoice={cancelAutoChoice}
        />
      )}

      {/* Post-match actions */}
      {isCompleted && !isTransitioning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="space-y-2.5"
        >
          {!rematchCancelled && (
            <RematchStatus
              countdown={countdown}
              myReady={myReady || hasSignaledRef.current}
              theirReady={theirReady}
            />
          )}

          <Button
            onClick={handleChangeOpponent}
            disabled={isChangingOpponent}
            className="w-full font-display tracking-wider text-xs bg-gradient-to-r from-neon-pink/80 to-neon-purple/80 hover:opacity-90 border-0 h-11 active:scale-[0.98] transition-transform"
          >
            {isChangingOpponent ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Shuffle className="size-4 mr-2" />
            )}
            {isChangingOpponent ? "CHANGING..." : "CHANGE OPPONENT"}
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/arena")}
            className="w-full font-display tracking-wider text-xs text-muted-foreground h-10"
          >
            <ArrowLeft className="size-4 mr-1" />
            BACK TO LOBBY
          </Button>
        </motion.div>
      )}

      {/* Transitioning */}
      {isCompleted && isTransitioning && (
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

/* ─── Sub-components ───────────────────────────────────────── */

/** Compact auto-select toggle pill */
function AutoSelectToggle({
  enabled,
  onToggle,
  size = "default",
}: {
  enabled: boolean;
  onToggle: () => void;
  size?: "default" | "small";
}) {
  const isSmall = size === "small";
  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-1.5 rounded-full border transition-all duration-200 cursor-pointer
        active:scale-95
        ${isSmall ? "px-2 py-0.5" : "px-2.5 py-1"}
        ${
          enabled
            ? "bg-neon-gold/15 border-neon-gold/40 text-neon-gold"
            : "bg-card/40 border-border/30 text-muted-foreground"
        }
      `}
    >
      {enabled ? (
        <Zap className={isSmall ? "size-2.5" : "size-3"} />
      ) : (
        <ZapOff className={isSmall ? "size-2.5" : "size-3"} />
      )}
      <span className={`font-display tracking-wider ${isSmall ? "text-[8px]" : "text-[9px]"}`}>
        AUTO {enabled ? "ON" : "OFF"}
      </span>
      {/* Dot indicator */}
      <span
        className={`rounded-full ${isSmall ? "size-1.5" : "size-2"} ${
          enabled ? "bg-neon-gold" : "bg-muted-foreground/30"
        }`}
      />
    </button>
  );
}

function RematchStatus({
  countdown,
  myReady,
  theirReady,
}: {
  countdown: number | null;
  myReady: boolean;
  theirReady: boolean;
}) {
  if (countdown !== null && countdown > 0) {
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

function PlayerHeader({
  myName,
  theirName,
  totalPot,
  autoSelectEnabled,
  onToggleAutoSelect,
}: {
  myName: string;
  theirName: string;
  totalPot: number;
  betAmount: number;
  autoSelectEnabled: boolean;
  onToggleAutoSelect: () => void;
}) {
  return (
    <div className="rounded-2xl bg-card/50 backdrop-blur-md border border-border/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <PlayerAvatar name={myName} label="YOU" gradient="from-neon-purple to-neon-blue" />
        <div className="flex flex-col items-center gap-1.5">
          <div className="font-display font-bold text-base tracking-wider text-muted-foreground">
            VS
          </div>
          <AutoSelectToggle enabled={autoSelectEnabled} onToggle={onToggleAutoSelect} size="small" />
        </div>
        <PlayerAvatar name={theirName} label="OPP" gradient="from-neon-pink to-neon-gold" />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-neon-gold/10 to-neon-gold/5 border border-neon-gold/20"
      >
        <Coins className="size-4 text-neon-gold" />
        <span className="font-display font-black text-xl tracking-wider text-neon-gold">
          {totalPot.toLocaleString()}
        </span>
        <span className="text-[10px] text-neon-gold/60 font-display tracking-wider">
          POT
        </span>
      </motion.div>
    </div>
  );
}

function PlayerAvatar({
  name,
  label,
  gradient,
}: {
  name: string;
  label: string;
  gradient: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
      >
        <User className="size-5 text-white" />
      </div>
      <span className="text-xs text-foreground font-medium truncate max-w-[80px] text-center">
        {name}
      </span>
      <span className="text-[9px] text-muted-foreground font-display tracking-wider">
        {label}
      </span>
    </div>
  );
}

function ChoiceSelector({
  onSelect,
  isSubmitting,
  selectedChoice,
  matchTimer,
  autoChoiceRunning,
  autoChoiceTimer,
  cyclingIndex,
  autoSelectEnabled,
  onToggleAutoSelect,
  onManualAutoChoice,
  onCancelAutoChoice,
}: {
  onSelect: (choice: Choice) => void;
  isSubmitting: boolean;
  selectedChoice: Choice | null;
  matchTimer: number;
  autoChoiceRunning: boolean;
  autoChoiceTimer: number;
  cyclingIndex: number;
  autoSelectEnabled: boolean;
  onToggleAutoSelect: () => void;
  onManualAutoChoice: () => void;
  onCancelAutoChoice: () => void;
}) {
  const timerPercent = (matchTimer / MATCH_TIMER_SECONDS) * 100;
  const isUrgent = matchTimer <= 10;
  const autoPercent = autoChoiceRunning ? ((3000 - autoChoiceTimer) / 3000) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Match timer */}
      <div className="space-y-2">
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

      <div className="text-center">
        <span className="font-display text-xs tracking-[0.3em] text-neon-purple uppercase">
          Make Your Move
        </span>
      </div>

      <div className="flex gap-3 justify-center">
        {CHOICES.map((choice, index) => {
          const isSelected = selectedChoice === choice.value;
          const isCycled = autoChoiceRunning && cyclingIndex === index;
          return (
            <motion.button
              key={choice.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              whileTap={autoChoiceRunning ? undefined : { scale: 0.92 }}
              onClick={() => !autoChoiceRunning && onSelect(choice.value)}
              disabled={isSubmitting || autoChoiceRunning}
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
                {choice.emoji}
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

      {/* Auto-choice running progress */}
      {autoChoiceRunning ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-center gap-2">
            <Zap className="size-4 text-neon-gold animate-pulse" />
            <span className="font-display text-xs tracking-wider text-neon-gold">
              AUTO-SELECTING...
            </span>
          </div>
          <div className="h-2 rounded-full bg-card/60 border border-neon-gold/30 overflow-hidden mx-4">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-neon-gold to-neon-pink"
              initial={{ width: "0%" }}
              animate={{ width: `${autoPercent}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
          {/* Cancel button — stop auto-choice and switch back to manual */}
          <Button
            onClick={() => {
              onCancelAutoChoice();
              // Also turn off persistent auto-select
              if (autoSelectEnabled) onToggleAutoSelect();
            }}
            className="w-full font-display tracking-wider text-xs bg-destructive/20 text-destructive hover:bg-destructive/30 border-0 h-9 active:scale-[0.98] transition-transform"
          >
            <ZapOff className="size-3.5 mr-1.5" />
            CANCEL AUTO
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2"
        >
          {/* Toggle auto-select on/off */}
          <Button
            onClick={onToggleAutoSelect}
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
              onClick={onManualAutoChoice}
              disabled={isSubmitting}
              className="flex-1 font-display tracking-wider text-xs bg-gradient-to-r from-neon-gold/70 to-neon-pink/70 hover:from-neon-gold/90 hover:to-neon-pink/90 border-0 h-10 active:scale-[0.98] transition-transform"
            >
              <Zap className="size-4 mr-1.5" />
              RANDOM
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}

function WaitingForOpponent({ myChoice }: { myChoice: Choice | null }) {
  const choiceData = CHOICES.find((c) => c.value === myChoice);

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
          <span className="text-3xl">{choiceData.emoji}</span>
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

function ResultReveal({
  match,
  didWin,
  didLose,
  isDraw,
  totalPot,
}: {
  match: MatchData;
  didWin: boolean;
  didLose: boolean;
  isDraw: boolean;
  totalPot: number;
}) {
  const myChoiceValue = match.isCreator ? match.creatorChoice : match.opponentChoiceRaw;
  const theirChoiceValue = match.isCreator ? match.opponentChoiceRaw : match.creatorChoice;
  const myChoiceData = CHOICES.find((c) => c.value === myChoiceValue);
  const theirChoiceData = CHOICES.find((c) => c.value === theirChoiceValue);

  const resultConfig = didWin
    ? { title: "VICTORY!", subtitle: `+${totalPot.toLocaleString()} tokens`, color: "text-neon-green", bgGlow: "shadow-neon-green/20", borderColor: "border-neon-green/30" }
    : isDraw
      ? { title: "DRAW", subtitle: `+${match.betAmount.toLocaleString()} tokens refunded`, color: "text-neon-gold", bgGlow: "shadow-neon-gold/20", borderColor: "border-neon-gold/30" }
      : { title: "DEFEAT", subtitle: `${(-match.betAmount).toLocaleString()} tokens`, color: "text-destructive", bgGlow: "shadow-destructive/20", borderColor: "border-destructive/30" };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Choice reveal */}
      <div className="flex items-center justify-center gap-5">
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150, delay: 0.2 }}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-[72px] h-[72px] rounded-2xl bg-card/60 backdrop-blur-md border border-neon-purple/30 flex items-center justify-center text-4xl shadow-lg shadow-neon-purple/10">
            {myChoiceData?.emoji ?? "?"}
          </div>
          <span className="text-[10px] text-muted-foreground font-display tracking-wider">YOU</span>
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.5 }}
          className="font-display font-bold text-base text-muted-foreground"
        >
          VS
        </motion.div>

        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150, delay: 0.3 }}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-[72px] h-[72px] rounded-2xl bg-card/60 backdrop-blur-md border border-neon-pink/30 flex items-center justify-center text-4xl shadow-lg shadow-neon-pink/10">
            {theirChoiceData?.emoji ?? "?"}
          </div>
          <span className="text-[10px] text-muted-foreground font-display tracking-wider">OPP</span>
        </motion.div>
      </div>

      {/* Result banner */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.7 }}
        className={`rounded-2xl bg-card/50 backdrop-blur-md border ${resultConfig.borderColor} p-5 text-center shadow-lg ${resultConfig.bgGlow}`}
      >
        {didWin && (
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.9 }}
            className="mb-2"
          >
            <Trophy className="size-9 text-neon-gold mx-auto" />
          </motion.div>
        )}

        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className={`font-display font-black text-2xl tracking-wider ${resultConfig.color}`}
        >
          {resultConfig.title}
        </motion.h2>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex items-center justify-center gap-1.5 mt-1.5"
        >
          <Coins className={`size-3.5 ${resultConfig.color}`} />
          <span className={`font-display font-bold text-sm tracking-wider ${resultConfig.color}`}>
            {resultConfig.subtitle}
          </span>
        </motion.div>

        {myChoiceData && theirChoiceData && !isDraw && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-xs text-muted-foreground mt-2"
          >
            {didWin
              ? `${myChoiceData.label} beats ${theirChoiceData.label}`
              : `${theirChoiceData.label} beats ${myChoiceData.label}`}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
