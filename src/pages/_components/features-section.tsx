import { motion } from "motion/react";
import { Shield, Coins, Trophy, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

type Feature = {
  icon: ReactNode;
  title: string;
  description: string;
  gradient: string;
  glowColor: string;
};

const FEATURES: Feature[] = [
  {
    icon: <Coins className="size-7" />,
    title: "Token Betting",
    description:
      "Wager tokens in every match. Start with free tokens and build your bankroll through victories.",
    gradient: "from-neon-gold to-neon-gold/60",
    glowColor: "shadow-neon-gold/15 hover:shadow-neon-gold/30",
  },
  {
    icon: <Trophy className="size-7" />,
    title: "Ranked Matches",
    description:
      "Climb the leaderboard with every win. Earn prestige and unlock exclusive rewards.",
    gradient: "from-neon-purple to-neon-pink",
    glowColor: "shadow-neon-purple/15 hover:shadow-neon-purple/30",
  },
  {
    icon: <Shield className="size-7" />,
    title: "Fair Play",
    description:
      "Server-side resolution ensures every match is provably fair. No cheating, no exploits.",
    gradient: "from-neon-blue to-neon-blue/60",
    glowColor: "shadow-neon-blue/15 hover:shadow-neon-blue/30",
  },
  {
    icon: <Sparkles className="size-7" />,
    title: "Instant Results",
    description:
      "Real-time match resolution with animated reveals. Feel the rush of every showdown.",
    gradient: "from-neon-green to-neon-green/60",
    glowColor: "shadow-neon-green/15 hover:shadow-neon-green/30",
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative px-6 py-24 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="font-display text-xs tracking-[0.3em] text-neon-blue uppercase">
          Why Play
        </span>
        <h2 className="font-display font-bold text-3xl sm:text-5xl tracking-tight mt-3 text-foreground">
          The Ultimate Arena
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div
              className={`group relative h-full rounded-2xl bg-card/50 backdrop-blur-md border border-border/50 p-6 transition-all duration-500 shadow-lg ${feature.glowColor}`}
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-5`}
              >
                {feature.icon}
              </div>

              <h3 className="font-display font-bold text-lg tracking-wide text-foreground mb-2">
                {feature.title}
              </h3>

              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Bottom glow line */}
              <div
                className={`absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-500`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
