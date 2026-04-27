import { RPS_TURNS_VARIANTS, type RpsTurn } from "@/convex/game/rcp/libs/rps";

export const TURNS: { value: RpsTurn; emoji: string; label: string }[] = [
  { value: RPS_TURNS_VARIANTS.ROCK, emoji: "🪨", label: "Rock" },
  { value: RPS_TURNS_VARIANTS.PAPER, emoji: "📄", label: "Paper" },
  { value: RPS_TURNS_VARIANTS.SCISSORS, emoji: "✂️", label: "Scissors" },
];