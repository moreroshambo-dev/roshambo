import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useGameRps } from "@/components/providers/rps";

export default function FreePlaySection() {
  const navigate = useNavigate();
  const rps = useGameRps()

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Gamepad2 className="size-4 text-neon-green" />
        <h2 className="font-display font-bold text-sm tracking-[0.2em] text-neon-green uppercase">
          Free Play
        </h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Play against a bot for fun — no tokens at stake.
      </p>
      <Button
        onClick={() => rps.handleQuickStart(0)}
        
        className="w-full font-display tracking-wider text-xs bg-gradient-to-r from-neon-green/80 to-neon-blue/80 hover:opacity-90 border-0 h-12 active:scale-[0.98] transition-transform cursor-pointer"
      >
        <Gamepad2 className="size-4 mr-2" />
        PLAY FOR FUN
      </Button>
    </motion.section>
  );
}
