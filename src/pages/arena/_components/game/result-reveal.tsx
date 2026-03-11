import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import { TURNS } from "./constants";
import { Coins, Trophy } from "lucide-react";
import { RPS_RESULT } from "@/convex/game/rcp/libs/rps";
import { RpsIcon } from "./rps-icon";
import { useGameRpsRoom } from "@/components/providers/rps";

export function ResultReveal() {
  const {room} = useGameRpsRoom()   
  const match = useQuery(api.game.rcp.match.get)   
  const myChoiceData = TURNS.find((c) => c.value === match?.myTurn);
  const theirChoiceData = TURNS.find((c) => c.value === match?.opponentTurn);

  const didWin = match?.result === RPS_RESULT.WIN
  const isDraw = match?.result === RPS_RESULT.DRAW

  const resultConfig = didWin
    ? { title: "VICTORY!", subtitle: `+${room?.totalPot?.toLocaleString() ?? 0} tokens`, color: "text-neon-green", bgGlow: "shadow-neon-green/20", borderColor: "border-neon-green/30" }
    : isDraw
      ? { title: "DRAW", subtitle: `+${room?.betAmount?.toLocaleString() ?? 0} tokens refunded`, color: "text-neon-gold", bgGlow: "shadow-neon-gold/20", borderColor: "border-neon-gold/30" }
      : { title: "DEFEAT", subtitle: `-${(room?.betAmount)?.toLocaleString() ?? 0} tokens`, color: "text-destructive", bgGlow: "shadow-destructive/20", borderColor: "border-destructive/30" };

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
            <RpsIcon
              size="sm"
              choice={myChoiceData.value}
            />
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
            <RpsIcon
              size="sm"
              choice={theirChoiceData.value}
            />
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
