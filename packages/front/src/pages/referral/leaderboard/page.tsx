import { motion } from "motion/react";
import { ArrowLeft, Trophy, Medal, Crown, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

type LeaderboardEntry = {
  rank: number;
  name: string;
  avatar: string;
  invites: number;
  earnings: number;
  isCurrentUser?: boolean;
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "MegaShark", avatar: "MS", invites: 142, earnings: 3420.50 },
  { rank: 2, name: "DiamondHands", avatar: "DH", invites: 98, earnings: 2180.00 },
  { rank: 3, name: "NightOwl", avatar: "NO", invites: 76, earnings: 1650.30 },
  { rank: 4, name: "QuantumAce", avatar: "QA", invites: 61, earnings: 1320.00 },
  { rank: 5, name: "BlitzKing", avatar: "BK", invites: 55, earnings: 1100.75 },
  { rank: 6, name: "CrystalKing", avatar: "CK", invites: 12, earnings: 124.50, isCurrentUser: true },
  { rank: 7, name: "VoltStrike", avatar: "VS", invites: 10, earnings: 98.20 },
  { rank: 8, name: "SolarFlare", avatar: "SF", invites: 9, earnings: 87.00 },
  { rank: 9, name: "FrostBite", avatar: "FB", invites: 7, earnings: 62.50 },
  { rank: 10, name: "ThunderBolt", avatar: "TB", invites: 5, earnings: 45.00 },
];

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="size-5 text-neon-gold" />;
    case 2:
      return <Medal className="size-5 text-slate-300" />;
    case 3:
      return <Medal className="size-5 text-orange-400" />;
    default:
      return null;
  }
}

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return "bg-neon-gold/10 border-neon-gold/30";
    case 2:
      return "bg-slate-300/5 border-slate-300/20";
    case 3:
      return "bg-orange-400/5 border-orange-400/20";
    default:
      return "bg-card/50 border-border/30";
  }
}

export default function ReferralLeaderboardPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto px-3 sm:px-4 py-5 space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => navigate("/referral")}
          className="p-2 rounded-xl bg-card/60 border border-border/40 hover:bg-secondary/60 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4 text-foreground" />
        </button>
        <div>
          <h1 className="font-display font-bold text-lg tracking-[0.2em] text-foreground uppercase">
            Leaderboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Top referrers this month</p>
        </div>
      </motion.div>

      {/* Top 3 podium */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-end justify-center gap-3 pt-4 pb-2"
      >
        {/* 2nd place */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-400/30 to-slate-300/10 border-2 border-slate-300/40 flex items-center justify-center mb-1.5">
            <span className="font-display font-bold text-xs text-slate-300">{MOCK_LEADERBOARD[1].avatar}</span>
          </div>
          <span className="font-display text-[10px] text-slate-300 tracking-wider font-bold">{MOCK_LEADERBOARD[1].name}</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">{MOCK_LEADERBOARD[1].invites} invites</span>
          <div className="w-16 h-16 mt-2 rounded-t-lg bg-slate-300/10 border border-slate-300/20 flex items-center justify-center">
            <span className="font-display font-bold text-lg text-slate-300">2</span>
          </div>
        </div>

        {/* 1st place */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-gold/40 to-neon-gold/10 border-2 border-neon-gold/50 flex items-center justify-center mb-1.5 shadow-lg shadow-neon-gold/20">
              <span className="font-display font-bold text-sm text-neon-gold">{MOCK_LEADERBOARD[0].avatar}</span>
            </div>
            <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 size-5 text-neon-gold" />
          </div>
          <span className="font-display text-[10px] text-neon-gold tracking-wider font-bold">{MOCK_LEADERBOARD[0].name}</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">{MOCK_LEADERBOARD[0].invites} invites</span>
          <div className="w-16 h-24 mt-2 rounded-t-lg bg-neon-gold/10 border border-neon-gold/20 flex items-center justify-center">
            <span className="font-display font-bold text-xl text-neon-gold">1</span>
          </div>
        </div>

        {/* 3rd place */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400/30 to-orange-400/10 border-2 border-orange-400/40 flex items-center justify-center mb-1.5">
            <span className="font-display font-bold text-xs text-orange-400">{MOCK_LEADERBOARD[2].avatar}</span>
          </div>
          <span className="font-display text-[10px] text-orange-400 tracking-wider font-bold">{MOCK_LEADERBOARD[2].name}</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">{MOCK_LEADERBOARD[2].invites} invites</span>
          <div className="w-16 h-12 mt-2 rounded-t-lg bg-orange-400/10 border border-orange-400/20 flex items-center justify-center">
            <span className="font-display font-bold text-lg text-orange-400">3</span>
          </div>
        </div>
      </motion.div>

      {/* Full list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="space-y-2"
      >
        {MOCK_LEADERBOARD.map((entry, i) => {
          const rankIcon = getRankIcon(entry.rank);
          const rankStyle = getRankStyle(entry.rank);
          return (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
              className={`flex items-center gap-3 rounded-xl border backdrop-blur-md p-3 ${rankStyle} ${
                entry.isCurrentUser ? "ring-1 ring-neon-purple/50 shadow-lg shadow-neon-purple/10" : ""
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                {rankIcon ?? (
                  <span className="font-display font-bold text-sm text-muted-foreground">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                entry.isCurrentUser
                  ? "bg-gradient-to-br from-neon-purple/30 to-neon-blue/30 border border-neon-purple/40"
                  : "bg-gradient-to-br from-secondary to-card border border-border/40"
              }`}>
                <span className="font-display font-bold text-[10px] text-foreground/80 tracking-wider">
                  {entry.avatar}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-display font-bold text-sm truncate ${
                    entry.isCurrentUser ? "text-neon-purple" : "text-foreground"
                  }`}>
                    {entry.name}
                  </span>
                  {entry.isCurrentUser && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple font-display tracking-wider border border-neon-purple/20">
                      YOU
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">{entry.invites} invites</span>
              </div>

              {/* Earnings */}
              <div className="text-right flex-shrink-0">
                <span className="font-display font-bold text-sm text-neon-gold">
                  €{entry.earnings.toLocaleString()}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Current user highlight card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-2xl bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 border border-neon-purple/30 p-4 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Star className="size-4 text-neon-purple" />
          <span className="font-display font-bold text-xs tracking-[0.15em] text-neon-purple uppercase">
            Your Rank: #6
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Invite 49 more friends to reach the Top 5!
        </p>
      </motion.div>
    </div>
  );
}
