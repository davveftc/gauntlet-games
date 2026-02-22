"use client";
import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

interface SpellingBeeProgressProps {
  total: number;
  results: ("correct" | "incorrect" | "pending")[];
  currentIndex: number;
}

export default function SpellingBeeProgress({ total, results, currentIndex }: SpellingBeeProgressProps) {
  return (
    <div className="flex justify-center gap-3 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const result = results[i] || "pending";
        const isCurrent = i === currentIndex;

        return (
          <motion.div
            key={i}
            animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-display font-bold text-sm ${
              result === "correct"
                ? "border-success bg-success/20 text-success"
                : result === "incorrect"
                ? "border-error bg-error/20 text-error"
                : isCurrent
                ? "border-accent bg-accent/10 text-accent"
                : "border-dim/30 bg-transparent text-dim"
            }`}
          >
            {result === "correct" ? (
              <Check size={16} />
            ) : result === "incorrect" ? (
              <X size={16} />
            ) : (
              i + 1
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
