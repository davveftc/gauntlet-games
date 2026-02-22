"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TileState } from "@/types";

interface WordlessTileProps {
  letter: string;
  state: TileState;
  delay?: number;
}

const stateColors: Record<TileState, string> = {
  empty: "border-dim/30 bg-transparent",
  tbd: "border-muted bg-surface",
  correct: "border-success bg-success/30 text-success",
  present: "border-accent bg-accent/30 text-accent",
  absent: "border-dim/50 bg-dim/20 text-dim",
};

export default function WordlessTile({ letter, state, delay = 0 }: WordlessTileProps) {
  const shouldFlip = state !== "empty" && state !== "tbd";

  return (
    <motion.div
      className={cn(
        "w-14 h-14 sm:w-16 sm:h-16 border-2 rounded-lg flex items-center justify-center font-display text-2xl font-bold uppercase transition-colors",
        stateColors[state]
      )}
      initial={shouldFlip ? { rotateX: 0 } : undefined}
      animate={shouldFlip ? { rotateX: [0, 90, 0] } : undefined}
      transition={shouldFlip ? { duration: 0.5, delay: delay * 0.15 } : undefined}
    >
      {letter}
    </motion.div>
  );
}
