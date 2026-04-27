import { motion } from "motion/react";
import { Users, Activity, Trophy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import ReferralStats from "./_components/referral-stats.tsx";
import LevelProgress from "./_components/level-progress.tsx";
import RewardsCards from "./_components/rewards-cards.tsx";
import RulesSection from "./_components/rules-section.tsx";

export default function ReferralPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto px-3 sm:px-4 py-5 space-y-5">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <h1 className="font-display font-bold text-lg tracking-[0.2em] text-foreground uppercase">
          Referral Program
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Invite friends. Earn together. Level up.
        </p>
      </motion.div>

      {/* Earnings stats */}
      <ReferralStats />

      {/* Level progress */}
      <LevelProgress />

      {/* Rewards section */}
      <RewardsCards />

      {/* Quick navigation cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="grid grid-cols-2 gap-2"
      >
        <button
          onClick={() => navigate("/referral/activity")}
          className="flex items-center gap-2 rounded-xl bg-card/50 border border-border/30 backdrop-blur-md p-3 hover:border-neon-blue/40 transition-colors cursor-pointer"
        >
          <Activity className="size-4 text-neon-blue" />
          <span className="font-display font-bold text-xs text-foreground tracking-wider">ACTIVITY</span>
          <ChevronRight className="size-3.5 text-muted-foreground ml-auto" />
        </button>
        <button
          onClick={() => navigate("/referral/leaderboard")}
          className="flex items-center gap-2 rounded-xl bg-card/50 border border-border/30 backdrop-blur-md p-3 hover:border-neon-gold/40 transition-colors cursor-pointer"
        >
          <Trophy className="size-4 text-neon-gold" />
          <span className="font-display font-bold text-xs text-foreground tracking-wider">TOP</span>
          <ChevronRight className="size-3.5 text-muted-foreground ml-auto" />
        </button>
      </motion.div>

      {/* Rules section (collapsible) */}
      <RulesSection />

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="pt-2"
      >
        <Button
          onClick={() => navigate("/referral/invite")}
          className="w-full h-12 font-display font-bold tracking-[0.2em] text-sm bg-gradient-to-r from-neon-green to-neon-blue hover:opacity-90 transition-opacity border-0 rounded-xl shadow-lg shadow-neon-green/20 cursor-pointer"
        >
          <Users className="size-4.5 mr-2" />
          INVITE FRIENDS
        </Button>
      </motion.div>
    </div>
  );
}
