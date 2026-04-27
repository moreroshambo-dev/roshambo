import { motion } from "motion/react";
import { Crown, Star, Gem } from "lucide-react";

type LevelTier = "bronze" | "silver" | "gold";

const LEVELS: Record<LevelTier, { label: string; icon: typeof Crown; threshold: number; color: string; glowColor: string; benefits: string }> = {
  bronze: {
    label: "Bronze",
    icon: Star,
    threshold: 0,
    color: "text-orange-400",
    glowColor: "shadow-orange-400/20",
    benefits: "10% rev share for 30 days",
  },
  silver: {
    label: "Silver",
    icon: Gem,
    threshold: 10,
    color: "text-slate-300",
    glowColor: "shadow-slate-300/20",
    benefits: "15% rev share for 60 days + bonus",
  },
  gold: {
    label: "Gold",
    icon: Crown,
    threshold: 25,
    color: "text-neon-gold",
    glowColor: "shadow-neon-gold/20",
    benefits: "25% rev share forever + VIP perks",
  },
};

// Mock data
const CURRENT_LEVEL: LevelTier = "silver";
const CURRENT_REFERRALS = 12;
const NEXT_LEVEL_THRESHOLD = 25;

export default function LevelProgress() {
  const level = LEVELS[CURRENT_LEVEL];
  const Icon = level.icon;
  const progress = Math.min((CURRENT_REFERRALS / NEXT_LEVEL_THRESHOLD) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-2xl bg-card/60 border border-border/40 backdrop-blur-xl p-4"
    >
      {/* Current level badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-card to-secondary flex items-center justify-center border border-border/60 shadow-lg ${level.glowColor}`}>
            <Icon className={`size-5 ${level.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-display font-bold text-sm tracking-wider ${level.color}`}>
                {level.label.toUpperCase()}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-green/10 text-neon-green font-display tracking-wider border border-neon-green/20">
                LVL 2
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{level.benefits}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-display tracking-wider">
            {CURRENT_REFERRALS} / {NEXT_LEVEL_THRESHOLD} referrals
          </span>
          <span className="text-neon-gold font-display font-bold tracking-wider">
            GOLD
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-secondary/80 overflow-hidden border border-border/30">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
            className="h-full rounded-full bg-gradient-to-r from-neon-purple via-neon-blue to-neon-green relative"
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </motion.div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          {NEXT_LEVEL_THRESHOLD - CURRENT_REFERRALS} more referrals to unlock Gold tier
        </p>
      </div>

      {/* Tier preview */}
      <div className="grid grid-cols-3 gap-1.5 mt-4">
        {(Object.entries(LEVELS) as [LevelTier, typeof LEVELS[LevelTier]][]).map(([key, tier]) => {
          const TierIcon = tier.icon;
          const isActive = key === CURRENT_LEVEL;
          const isPast = (key === "bronze" && CURRENT_LEVEL !== "bronze");
          return (
            <div
              key={key}
              className={`rounded-lg p-2 text-center transition-all ${
                isActive
                  ? "bg-neon-purple/10 border border-neon-purple/30"
                  : isPast
                    ? "bg-secondary/40 border border-border/20 opacity-60"
                    : "bg-secondary/20 border border-border/10 opacity-40"
              }`}
            >
              <TierIcon className={`size-3.5 mx-auto mb-0.5 ${isActive ? tier.color : "text-muted-foreground"}`} />
              <span className={`text-[9px] font-display tracking-wider ${isActive ? tier.color : "text-muted-foreground"}`}>
                {tier.label.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
