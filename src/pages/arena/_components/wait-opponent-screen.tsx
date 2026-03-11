import { motion } from "motion/react";
import { Loader2, Shield, Sparkles, Users } from "lucide-react";

export default function WaitOpponentScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-[0_25px_80px_-50px_rgba(101,92,255,0.45)] backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,0,186,0.08),transparent_30%),radial-gradient(circle_at_80%_0,rgba(0,255,170,0.08),transparent_28%)]" />
      <div className="relative p-6 flex flex-col items-center text-center gap-5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="relative flex items-center justify-center"
        >
          <div className="size-24 rounded-full border-2 border-neon-purple/60 border-t-neon-green shadow-inner shadow-neon-purple/40" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-neon-purple/20 via-transparent to-neon-green/15 blur-md" />
          <Loader2 className="absolute size-8 text-neon-purple animate-spin" />
        </motion.div>

        <div className="space-y-2">
          <p className="text-xs font-display tracking-[0.25em] uppercase text-neon-purple">
            waiting
          </p>
          <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Ищем соперника для тебя
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Система подбирает игрока с похожим уровнем и ставкой. Обычно это занимает меньше
            минуты.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full text-left">
          <InfoPill
            icon={<Users className="size-4 text-neon-green" />}
            label="Матчмейкинг"
            value="Подбираем пару"
          />
          <InfoPill
            icon={<Shield className="size-4 text-neon-gold" />}
            label="Честная игра"
            value="Ставка заблокирована"
          />
          <InfoPill
            icon={<Sparkles className="size-4 text-neon-pink" />}
            label="Подсказка"
            value="Можно сменить ставку в лобби"
          />
        </div>

        <p className="text-[11px] text-muted-foreground/80">
          Передумал? Нажми «Выйти» сверху — вернёмся в лобби без штрафов.
        </p>
      </div>
    </motion.div>
  );
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 px-3 py-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-display">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold text-foreground leading-tight">{value}</div>
    </div>
  );
}
