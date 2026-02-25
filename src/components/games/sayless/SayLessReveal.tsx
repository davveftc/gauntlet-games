"use client";
import { motion } from "framer-motion";
import { Film, PartyPopper, XCircle } from "lucide-react";
import Button from "@/components/shared/Button";

interface SayLessRevealProps {
  movie: string;
  year: number;
  genre: string;
  posterUrl: string | null;
  won: boolean;
  onContinue: () => void;
}

export default function SayLessReveal({
  movie,
  year,
  genre,
  posterUrl,
  won,
  onContinue,
}: SayLessRevealProps) {
  const handleContinue = () => {
    onContinue();
  };

  const borderColor = won ? "border-success/30" : "border-error/30";
  const shadowColor = won ? "shadow-success/10" : "shadow-error/10";

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-deep/80 backdrop-blur-sm z-50"
        onClick={handleContinue}
      />

      {/* Popup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className={`glass-card border ${borderColor} rounded-2xl p-6 w-full max-w-xs flex flex-col items-center text-center gap-4 pointer-events-auto shadow-2xl ${shadowColor}`}>
          {/* Header */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2"
          >
            {won ? (
              <>
                <PartyPopper size={22} className="text-accent" />
                <h3 className="font-display text-2xl font-bold text-success">
                  Correct!
                </h3>
                <PartyPopper size={22} className="text-accent" />
              </>
            ) : (
              <>
                <XCircle size={22} className="text-error" />
                <h3 className="font-display text-2xl font-bold text-error">
                  The answer was...
                </h3>
              </>
            )}
          </motion.div>

          {/* Movie poster */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="relative w-32 h-48 rounded-xl overflow-hidden shadow-lg shadow-primary/20"
          >
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={movie}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface flex items-center justify-center">
                <Film size={48} className="text-muted" />
              </div>
            )}
          </motion.div>

          {/* Movie info */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <p className="font-display font-bold text-lg text-white">{movie}</p>
            <p className="text-muted text-sm">{year} &middot; {genre}</p>
          </motion.div>

          {/* Continue button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full"
          >
            <Button
              variant="primary"
              size="md"
              onClick={handleContinue}
              className="w-full"
            >
              Continue
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
