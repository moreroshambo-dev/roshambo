import { motion } from "motion/react";
import { ArrowLeft, UserCheck, Coins, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ReferralStatus = "registered" | "deposited" | "active";

type ReferralUser = {
  name: string;
  avatar: string;
  status: ReferralStatus;
  earned: number;
  date: string;
};

const STATUS_CONFIG: Record<ReferralStatus, { label: string; color: string; bg: string; border: string }> = {
  registered: { label: "Registered", color: "text-muted-foreground", bg: "bg-muted/40", border: "border-muted-foreground/20" },
  deposited: { label: "Deposited", color: "text-neon-blue", bg: "bg-neon-blue/10", border: "border-neon-blue/20" },
  active: { label: "Active", color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/20" },
};

const MOCK_REFERRALS: ReferralUser[] = [
  { name: "CryptoWolf", avatar: "CW", status: "active", earned: 34.50, date: "2 days ago" },
  { name: "LuckyAce", avatar: "LA", status: "active", earned: 22.80, date: "4 days ago" },
  { name: "ShadowBet", avatar: "SB", status: "deposited", earned: 10.00, date: "1 week ago" },
  { name: "NeonRider", avatar: "NR", status: "deposited", earned: 10.00, date: "1 week ago" },
  { name: "PhantomX", avatar: "PX", status: "active", earned: 18.20, date: "2 weeks ago" },
  { name: "StormKing", avatar: "SK", status: "registered", earned: 0, date: "2 weeks ago" },
  { name: "BlazeFury", avatar: "BF", status: "deposited", earned: 10.00, date: "3 weeks ago" },
  { name: "IceVenom", avatar: "IV", status: "registered", earned: 0, date: "3 weeks ago" },
  { name: "DarkMatter", avatar: "DM", status: "active", earned: 19.00, date: "1 month ago" },
  { name: "QuantumBet", avatar: "QB", status: "registered", earned: 0, date: "1 month ago" },
];

export default function ReferralActivityPage() {
  const navigate = useNavigate();

  const totalEarned = MOCK_REFERRALS.reduce((sum, r) => sum + r.earned, 0);
  const activeCount = MOCK_REFERRALS.filter((r) => r.status === "active").length;
  const depositedCount = MOCK_REFERRALS.filter((r) => r.status === "deposited").length;

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
            Activity
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track your referral performance</p>
        </div>
      </motion.div>

      {/* Quick summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-3 gap-2"
      >
        <div className="rounded-xl bg-neon-green/10 border border-neon-green/20 p-3 text-center">
          <Activity className="size-4 mx-auto mb-1 text-neon-green" />
          <div className="font-display font-bold text-lg text-foreground">{activeCount}</div>
          <div className="text-[9px] text-muted-foreground tracking-wider uppercase">Active</div>
        </div>
        <div className="rounded-xl bg-neon-blue/10 border border-neon-blue/20 p-3 text-center">
          <UserCheck className="size-4 mx-auto mb-1 text-neon-blue" />
          <div className="font-display font-bold text-lg text-foreground">{depositedCount}</div>
          <div className="text-[9px] text-muted-foreground tracking-wider uppercase">Deposited</div>
        </div>
        <div className="rounded-xl bg-neon-gold/10 border border-neon-gold/20 p-3 text-center">
          <Coins className="size-4 mx-auto mb-1 text-neon-gold" />
          <div className="font-display font-bold text-lg text-foreground">€{totalEarned.toFixed(0)}</div>
          <div className="text-[9px] text-muted-foreground tracking-wider uppercase">Earned</div>
        </div>
      </motion.div>

      {/* Referral list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-2"
      >
        {MOCK_REFERRALS.map((referral, i) => {
          const status = STATUS_CONFIG[referral.status];
          return (
            <motion.div
              key={referral.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.04 }}
              className="flex items-center gap-3 rounded-xl bg-card/50 border border-border/30 backdrop-blur-md p-3"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-purple/30 to-neon-blue/30 border border-border/40 flex items-center justify-center flex-shrink-0">
                <span className="font-display font-bold text-[10px] text-foreground/80 tracking-wider">
                  {referral.avatar}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm text-foreground truncate">
                    {referral.name}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-display tracking-wider ${status.bg} ${status.color} border ${status.border}`}>
                    {status.label.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">{referral.date}</span>
              </div>

              {/* Earned */}
              <div className="text-right flex-shrink-0">
                {referral.earned > 0 ? (
                  <span className="font-display font-bold text-sm text-neon-green">
                    +€{referral.earned.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
