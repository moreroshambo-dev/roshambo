import { motion } from "motion/react";
import { Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

export default function ReferralEmptyState() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      {/* Animated illustration */}
      <motion.div
        animate={{
          y: [0, -6, 0],
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-6"
      >
        {/* Outer glow ring */}
        <div className="absolute inset-0 w-24 h-24 rounded-full bg-neon-green/10 blur-xl" />
        {/* Main circle */}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-blue/20 border-2 border-neon-green/30 flex items-center justify-center">
          <Users className="size-10 text-neon-green" />
        </div>
        {/* Floating sparkle */}
        <motion.div
          animate={{ rotate: 360, opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="size-5 text-neon-gold" />
        </motion.div>
      </motion.div>

      <h3 className="font-display font-bold text-base tracking-[0.15em] text-foreground uppercase mb-2">
        Invite Friends & Start Earning
      </h3>
      <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed mb-6">
        Share your unique referral link and earn €10 for every friend who joins. Plus 10% rev share for 30 days!
      </p>

      {/* Stats preview */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-6">
        <div className="rounded-lg bg-neon-green/5 border border-neon-green/15 p-2 text-center">
          <span className="font-display font-bold text-lg text-neon-green">€10</span>
          <p className="text-[9px] text-muted-foreground tracking-wider uppercase">Per Invite</p>
        </div>
        <div className="rounded-lg bg-neon-blue/5 border border-neon-blue/15 p-2 text-center">
          <span className="font-display font-bold text-lg text-neon-blue">10%</span>
          <p className="text-[9px] text-muted-foreground tracking-wider uppercase">Rev Share</p>
        </div>
        <div className="rounded-lg bg-neon-purple/5 border border-neon-purple/15 p-2 text-center">
          <span className="font-display font-bold text-lg text-neon-purple">3</span>
          <p className="text-[9px] text-muted-foreground tracking-wider uppercase">Tiers</p>
        </div>
      </div>

      <Button
        onClick={() => navigate("/referral/invite")}
        className="h-11 px-6 font-display font-bold tracking-[0.2em] text-sm bg-gradient-to-r from-neon-green to-neon-blue hover:opacity-90 transition-opacity border-0 rounded-xl shadow-lg shadow-neon-green/20 cursor-pointer"
      >
        <Users className="size-4 mr-2" />
        START INVITING
      </Button>
    </motion.div>
  );
}
