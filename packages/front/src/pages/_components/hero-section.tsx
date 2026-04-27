import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { Swords, Zap } from "lucide-react";

const CHOICES = [
  { emoji: "🪨", label: "Rock", delay: 0 },
  { emoji: "📄", label: "Paper", delay: 0.15 },
  { emoji: "✂️", label: "Scissors", delay: 0.3 },
];

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative px-6 pt-16 pb-24 max-w-7xl mx-auto">
      {/* Floating choice icons */}
      <div className="flex justify-center gap-6 sm:gap-10 mb-12">
        {CHOICES.map((choice) => (
          <motion.div
            key={choice.label}
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: choice.delay + 0.3, type: "spring", stiffness: 100 }}
            className="relative group"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: choice.delay, ease: "easeInOut" }}
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 flex items-center justify-center text-4xl sm:text-6xl shadow-lg shadow-neon-purple/10 group-hover:shadow-neon-purple/30 transition-shadow duration-500 cursor-default"
            >
              {choice.emoji}
            </motion.div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-neon-purple/40 to-transparent rounded-full blur-sm" />
          </motion.div>
        ))}
      </div>

      {/* Main heading */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="text-center space-y-6"
      >
        <h1 className="text-balance font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-none">
          <span className="bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent">
            ROCK PAPER
          </span>
          <br />
          <span className="text-foreground">SCISSORS</span>
        </h1>

        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-neon-purple/60" />
          <span className="font-display text-xs tracking-[0.3em] text-neon-purple uppercase">
            The Arena Awaits
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-neon-purple/60" />
        </div>

        <p className="text-muted-foreground text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
          Place your bets. Make your choice. Claim your glory in the ultimate
          high-stakes RPS arena.
        </p>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
      >
        <Button
          size="lg"
          onClick={() => navigate("/arena")}
          className="font-display tracking-wider text-sm h-12 px-8 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue hover:opacity-90 transition-all border-0 shadow-lg shadow-neon-purple/25 hover:shadow-neon-purple/40"
        >
          <Swords className="size-5 mr-1" />
          ENTER THE ARENA
        </Button>
      </motion.div>

      {/* Live stats banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="flex items-center justify-center gap-8 sm:gap-12 mt-16"
      >
        {[
          { value: "24/7", label: "Live Games" },
          { value: "1000+", label: "Tokens Daily" },
          { value: "< 1s", label: "Match Time" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="font-display font-bold text-xl sm:text-2xl text-foreground flex items-center gap-1">
              <Zap className="size-4 text-neon-gold" />
              {stat.value}
            </div>
            <div className="text-muted-foreground text-xs tracking-wider uppercase mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
