import { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, ChevronDown, UserCheck, Banknote, Dices, AlertTriangle } from "lucide-react";

type RuleItem = {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  color: string;
};

const RULES: RuleItem[] = [
  {
    icon: UserCheck,
    title: "KYC Verification Required",
    description: "Both you and your referred friend must complete identity verification before rewards are released. This protects against fraud.",
    color: "text-neon-blue",
  },
  {
    icon: Banknote,
    title: "Minimum Deposit",
    description: "Your referral must deposit at least €20 within 14 days of registration. Deposits below this threshold do not qualify.",
    color: "text-neon-green",
  },
  {
    icon: Dices,
    title: "Wagering Requirements",
    description: "Referred users must wager at least 3x their deposit amount before your referral bonus unlocks. This ensures genuine activity.",
    color: "text-neon-purple",
  },
  {
    icon: AlertTriangle,
    title: "Anti-Abuse Policy",
    description: "Self-referrals, duplicate accounts, and coordinated exploitation will result in permanent disqualification and forfeiture of all earnings.",
    color: "text-destructive",
  },
];

export default function RulesSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl bg-card/40 border border-border/30 backdrop-blur-md overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="size-4.5 text-muted-foreground" />
          <span className="font-display font-bold text-xs tracking-[0.15em] text-foreground uppercase">
            Rules & Requirements
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4 space-y-3"
        >
          {RULES.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <motion.div
                key={rule.title}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="flex gap-3 rounded-xl bg-secondary/30 border border-border/20 p-3"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className={`size-4 ${rule.color}`} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs text-foreground tracking-wider mb-0.5">
                    {rule.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
