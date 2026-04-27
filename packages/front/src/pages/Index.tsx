import { useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "@/components/providers/telegram.tsx";
import HeroSection from "./_components/hero-section.tsx";
import FeaturesSection from "./_components/features-section.tsx";
import HowItWorksSection from "./_components/how-it-works-section.tsx";
import Footer from "./_components/footer.tsx";

export default function Index() {
  const navigate = useNavigate();
  const { isTelegram } = useTelegram();

  // Inside Telegram, skip the landing page and go straight to arena
  useEffect(() => {
    if (isTelegram) {
      navigate("/arena", { replace: true });
    }
  }, [isTelegram, navigate]);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Ambient neon glow background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-neon-purple/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neon-blue/5 blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-neon-pink/3 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-white font-display font-bold text-sm">
            R
          </div>
          <span className="font-display font-bold text-lg tracking-wider text-foreground">
            RPS ARENA
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <Button
            size="sm"
            onClick={() => navigate("/arena")}
            className="font-display tracking-wider text-xs bg-gradient-to-r from-neon-purple to-neon-blue hover:opacity-90 transition-opacity border-0"
          >
            ENTER ARENA
          </Button>
        </motion.div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
      </main>

      <Footer />
    </div>
  );
}
