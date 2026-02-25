"use client";
import { motion } from "framer-motion";
import { MessageSquareQuote, Film } from "lucide-react";

interface SayLessPlayerProps {
  quote: string;
  posterUrl: string | null;
  guessNumber: number;
  maxGuesses: number;
}

const BLUR_LEVELS = [20, 8, 2];

export default function SayLessPlayer({
  quote,
  posterUrl,
  guessNumber,
  maxGuesses,
}: SayLessPlayerProps) {
  const blurPx = BLUR_LEVELS[Math.min(guessNumber, BLUR_LEVELS.length - 1)];
  const revealStep = Math.min(guessNumber + 1, maxGuesses);
  const progressPercent = (revealStep / maxGuesses) * 100;

  return (
    <div className="glass-card p-4 mb-3 flex flex-col gap-3">
      {/* Poster with progressive blur */}
      <div className="flex items-start gap-3">
        <div className="relative w-24 h-36 rounded-lg overflow-hidden shrink-0 bg-surface">
          {posterUrl ? (
            <motion.img
              src={posterUrl}
              alt="Movie poster"
              className="w-full h-full object-cover"
              animate={{ filter: `blur(${blurPx}px)` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ filter: `blur(${BLUR_LEVELS[0]}px)` }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film size={28} className="text-muted" />
            </div>
          )}
        </div>

        {/* Quote */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <MessageSquareQuote size={16} className="text-accent shrink-0 mt-0.5" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white text-sm leading-relaxed italic"
            >
              &ldquo;{quote}&rdquo;
            </motion.p>
          </div>
        </div>
      </div>

      {/* Reveal progress bar (like Songless audio progress) */}
      {posterUrl && (
        <div>
          <div className="w-full h-1.5 bg-deep rounded-full overflow-hidden mb-1">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted">
            <span>{revealStep}/{maxGuesses} revealed</span>
            <span>Guess to reveal more</span>
          </div>
        </div>
      )}
    </div>
  );
}
