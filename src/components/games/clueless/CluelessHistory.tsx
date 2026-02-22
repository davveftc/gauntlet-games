"use client";
import { motion } from "framer-motion";
import type { CluelessGuess } from "@/types";

interface CluelessHistoryProps {
  guesses: CluelessGuess[];
  targetWord?: string;
}

function getBarColor(similarity: number): string {
  if (similarity >= 90) return "bg-success";
  if (similarity >= 70) return "bg-accent";
  if (similarity >= 50) return "bg-accent/60";
  if (similarity >= 30) return "bg-secondary/60";
  return "bg-primary/60";
}

export default function CluelessHistory({ guesses, targetWord }: CluelessHistoryProps) {
  const sorted = [...guesses].sort((a, b) => b.similarity - a.similarity);

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {sorted.map((guess, i) => {
        const isTarget = targetWord && guess.word.toLowerCase() === targetWord.toLowerCase();
        return (
          <motion.div
            key={`${guess.word}-${i}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
              isTarget ? "bg-success/10 border border-success/30" : "bg-surface/30"
            }`}
          >
            <span className="text-xs text-dim w-6 text-right">{guesses.indexOf(guess) + 1}</span>
            <span className={`font-medium text-sm flex-1 ${isTarget ? "text-success" : "text-white"}`}>
              {guess.word}
            </span>
            <div className="w-20 h-2 bg-deep rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getBarColor(guess.similarity)}`}
                style={{ width: `${guess.similarity}%` }}
              />
            </div>
            <span className="text-xs font-bold w-12 text-right text-accent">
              {guess.similarity.toFixed(1)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
