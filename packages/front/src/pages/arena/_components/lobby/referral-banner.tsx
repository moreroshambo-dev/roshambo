import { motion } from "motion/react";
import { Gift, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ReferralBanner() {
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      className="mb-6"
    >
      <button
        onClick={() => navigate("/referral")}
        className="w-full rounded-xl bg-gradient-to-r from-neon-green/10 to-neon-blue/10 border border-neon-green/25 backdrop-blur-md p-3.5 flex items-center gap-3 hover:border-neon-green/40 transition-all cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-lg bg-neon-green/15 flex items-center justify-center flex-shrink-0">
          <Gift className="size-4.5 text-neon-green" />
        </div>
        <div className="flex-1 text-left">
          <span className="font-display font-bold text-xs tracking-[0.12em] text-foreground block">
            INVITE & EARN €10
          </span>
          <span className="text-[10px] text-muted-foreground">
            Get bonuses for every friend who joins
          </span>
        </div>
        <ChevronRight className="size-4 text-neon-green opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </button>
    </motion.section>
  );
}
