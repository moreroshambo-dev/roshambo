import { motion } from "motion/react";

const STEPS = [
  {
    step: "01",
    title: "Sign In",
    description: "Create your arena account and receive your starting tokens.",
    emoji: "🔑",
  },
  {
    step: "02",
    title: "Place Your Bet",
    description: "Choose how many tokens to wager. High stakes, high rewards.",
    emoji: "🎰",
  },
  {
    step: "03",
    title: "Make Your Move",
    description: "Rock, Paper, or Scissors. Trust your instincts. Choose wisely.",
    emoji: "🤜",
  },
  {
    step: "04",
    title: "Claim Victory",
    description: "Win the pot and climb the leaderboard. Become the champion.",
    emoji: "👑",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative px-6 py-24 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="font-display text-xs tracking-[0.3em] text-neon-pink uppercase">
          How It Works
        </span>
        <h2 className="font-display font-bold text-3xl sm:text-5xl tracking-tight mt-3 text-foreground">
          Four Steps to Glory
        </h2>
      </motion.div>

      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-8 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-neon-purple/40 via-neon-blue/40 to-neon-pink/40 hidden sm:block -translate-x-1/2" />

        <div className="space-y-12 sm:space-y-16">
          {STEPS.map((step, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col sm:flex-row items-center gap-6 ${
                  isEven ? "sm:flex-row" : "sm:flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${isEven ? "sm:text-right" : "sm:text-left"}`}>
                  <div className="inline-block rounded-xl bg-card/60 backdrop-blur-md border border-border/50 p-6 max-w-sm">
                    <div className="text-4xl mb-3">{step.emoji}</div>
                    <div className="font-display text-xs tracking-[0.2em] text-neon-purple mb-1">
                      STEP {step.step}
                    </div>
                    <h3 className="font-display font-bold text-xl tracking-wide text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Center node */}
                <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-white font-display font-bold text-xs shrink-0 shadow-lg shadow-neon-purple/30">
                  {step.step}
                </div>

                {/* Spacer for the other side */}
                <div className="flex-1 hidden sm:block" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
