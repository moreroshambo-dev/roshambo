import { motion } from "motion/react";
import { TrendingUp, Users, Coins } from "lucide-react";

const STATS = [
  {
    label: "Total Earned",
    value: "€124.50",
    icon: Coins,
    color: "text-neon-gold",
    bgColor: "bg-neon-gold/10",
    borderColor: "border-neon-gold/20",
  },
  {
    label: "Active Refs",
    value: "12",
    icon: Users,
    color: "text-neon-blue",
    bgColor: "bg-neon-blue/10",
    borderColor: "border-neon-blue/20",
  },
  {
    label: "This Month",
    value: "€34.20",
    icon: TrendingUp,
    color: "text-neon-green",
    bgColor: "bg-neon-green/10",
    borderColor: "border-neon-green/20",
  },
] as const;

export default function ReferralStats() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STATS.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className={`rounded-xl ${stat.bgColor} border ${stat.borderColor} backdrop-blur-md p-3 text-center`}
          >
            <div className="flex justify-center mb-1.5">
              <Icon className={`size-4.5 ${stat.color}`} />
            </div>
            <div className="font-display font-bold text-lg text-foreground tracking-wider">
              {stat.value}
            </div>
            <div className="text-muted-foreground text-[10px] tracking-wider uppercase mt-0.5">
              {stat.label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
