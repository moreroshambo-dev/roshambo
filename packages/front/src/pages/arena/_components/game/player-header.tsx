import { motion } from "motion/react";
import { PlayerAvatar } from "./player-avatar";
import { Coins } from "lucide-react";
import { Zap, ZapOff } from "lucide-react";
import { useGameRps, useGameRpsRoom } from "@/components/providers/rps";

export function PlayerHeader() {
  const {room} = useGameRpsRoom()
  const myName = room?.you?.name ?? "You";
  const theirName = room?.opponent?.name ?? "Opponent"
  const totalPot = room?.totalPot ?? 0;

  return (
    <div className="rounded-2xl bg-card/50 backdrop-blur-md border border-border/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <PlayerAvatar url={room?.you?.avatar} name={myName} label="YOU" gradient="from-neon-purple to-neon-blue" />
        <div className="flex flex-col items-center gap-1.5">
          <div className="font-display font-bold text-base tracking-wider text-muted-foreground select-none">
            VS
          </div>
          <AutoSelectToggleTag size="small" />
        </div>
        <PlayerAvatar url={room?.opponent?.avatar} name={theirName} label="OPP" gradient="from-neon-pink to-neon-gold" />
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

function AutoSelectToggleTag({
  size = "default",
}: {
  size?: "default" | "small";
}) {
  const isSmall = size === "small";
  const {settings: {toggle, value: {autoSelectEnabled}}} = useGameRps()

  return (
    <button
      onClick={toggle}
      className={`
        flex items-center gap-1.5 rounded-full border transition-all duration-200 cursor-pointer
        active:scale-95
        select-none
        ${isSmall ? "px-2 py-0.5" : "px-2.5 py-1"}
        ${
          autoSelectEnabled
            ? "bg-neon-gold/15 border-neon-gold/40 text-neon-gold"
            : "bg-card/40 border-border/30 text-muted-foreground"
        }
      `}
    >
      {autoSelectEnabled ? (
        <Zap className={isSmall ? "size-2.5" : "size-3"} />
      ) : (
        <ZapOff className={isSmall ? "size-2.5" : "size-3"} />
      )}
      <span className={`font-display tracking-wider ${isSmall ? "text-[8px]" : "text-[9px]"}`}>
        AUTO {autoSelectEnabled ? "ON" : "OFF"}
      </span>
      {/* Dot indicator */}
      <span
        className={`rounded-full ${isSmall ? "size-1.5" : "size-2"} ${
          autoSelectEnabled ? "bg-neon-gold" : "bg-muted-foreground/30"
        }`}
      />
    </button>
  );
}
