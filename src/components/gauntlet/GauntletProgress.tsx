"use client";
import { motion } from "framer-motion";
import type { GameId } from "@/types";

interface GauntletProgressProps {
  gameOrder: GameId[];
  currentIndex: number;
  results: Record<string, "win" | "loss">;
}

const GAME_NAMES: Record<GameId, string> = {
  wordless: "Wordless",
  songless: "Songless",
  sayless: "Say Less",
  moreless: "More/Less",
  clueless: "Clueless",
  spellingbee: "Spelling Bee",
  faceless: "Faceless",
};

const GAME_EMOJIS: Record<GameId, string> = {
  wordless: "\u{1F524}",
  songless: "\u{1F3B5}",
  sayless: "\u{1F3AC}",
  moreless: "\u{1F4CA}",
  clueless: "\u{1F50D}",
  spellingbee: "\u{1F41D}",
  faceless: "\u{1F3AD}",
};

export default function GauntletProgress({ gameOrder, currentIndex, results }: GauntletProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {gameOrder.map((gameId, i) => {
        const result = results[gameId];
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;

        return (
          <motion.div
            key={gameId}
            animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg ${
              result === "win"
                ? "bg-success/10 border border-success/30"
                : result === "loss"
                ? "bg-error/10 border border-error/30"
                : isCurrent
                ? "bg-accent/10 border border-accent/30"
                : "bg-surface/30 border border-dim/20"
            }`}
          >
            <span className="text-lg">{GAME_EMOJIS[gameId]}</span>
            <span className={`text-[9px] font-medium ${
              result === "win" ? "text-success" : result === "loss" ? "text-error" : isCurrent ? "text-accent" : "text-dim"
            }`}>
              {GAME_NAMES[gameId]}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
