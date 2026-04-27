import clsx from "clsx";
import rock from "@/assets/rps/rock.png";
import scissors from "@/assets/rps/scissors.webp";
import paper from "@/assets/rps/paper.webp";

import { RPS_TURNS_VARIANTS, type RpsTurn } from "@/convex/game/rcp/libs/rps";

const sources: Record<RpsTurn, { src: string; alt: string }> = {
  [RPS_TURNS_VARIANTS.ROCK]: { src: rock, alt: "Камень" },
  [RPS_TURNS_VARIANTS.PAPER]: { src: paper, alt: "Бумага" },
  [RPS_TURNS_VARIANTS.SCISSORS]: { src: scissors, alt: "Ножницы" },
};

type Props = {
  choice: RpsTurn;
  size?: 'text' | "sm" | "md" | "lg" ;
  className?: string;
};

const sizeMap: Record<NonNullable<Props["size"]>, string> = {
  text: "h-4 w-4",
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

export function RpsIcon({ choice, size = "md", className }: Props) {
  const { src, alt } = sources[choice];

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={clsx("object-contain select-none", sizeMap[size], className)}
      draggable={false}
    />
  );
}
