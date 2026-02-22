"use client";
import { motion } from "framer-motion";
import { X, SkipForward, Check } from "lucide-react";

interface SayLessGuessRowProps {
  guess: { movie: string; year: number } | "skipped";
  index: number;
  isCorrect: boolean;
}

const shakeAnimation = {
  x: [0, -8, 8, -6, 6, -3, 3, 0],
};

export default function SayLessGuessRow({ guess, index, isCorrect }: SayLessGuessRowProps) {
  const isSkipped = guess === "skipped";
  const isWrong = !isCorrect && !isSkipped;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={
        isWrong
          ? { opacity: 1, ...shakeAnimation }
          : { opacity: 1, x: 0 }
      }
      transition={
        isWrong
          ? { opacity: { duration: 0.2 }, x: { duration: 0.5, ease: "easeOut" } }
          : { duration: 0.2 }
      }
      className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-sm ${
        isCorrect
          ? "bg-success/10 border border-success/30"
          : isWrong
          ? "bg-error/10 border border-error/30"
          : "bg-[rgba(26,16,64,0.7)] border border-primary/30"
      }`}
    >
      <span className="text-[10px] text-dim w-4 shrink-0">{index + 1}</span>
      {isSkipped ? (
        <div className="flex items-center gap-1.5 text-dim flex-1 min-w-0">
          <SkipForward size={12} />
          <span className="text-xs">Skipped</span>
        </div>
      ) : (
        <p className="flex-1 min-w-0 truncate">
          <span className={`font-medium ${isCorrect ? "text-success" : isWrong ? "text-error" : "text-white"}`}>
            {guess.movie}
          </span>
          <span className="text-muted text-xs"> ({guess.year})</span>
        </p>
      )}
      {isWrong && <X size={14} className="text-error shrink-0" />}
      {isCorrect && <Check size={14} className="text-success shrink-0" />}
    </motion.div>
  );
}
