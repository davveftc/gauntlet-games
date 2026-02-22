"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Film, PartyPopper } from "lucide-react";
import Button from "@/components/shared/Button";

interface SayLessSuccessProps {
  movie: string;
  year: number;
  genre: string;
  quote: string;
  posterUrl: string | null;
  onContinue: () => void;
}

export default function SayLessSuccess({
  movie,
  year,
  genre,
  quote,
  posterUrl,
  onContinue,
}: SayLessSuccessProps) {
  // Speak the full quote on mount
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(quote);
    utterance.rate = 0.9;
    utterance.pitch = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Daniel")
    ) || voices.find(
      (v) => v.lang.startsWith("en-US")
    ) || voices.find(
      (v) => v.lang.startsWith("en")
    );
    if (preferred) utterance.voice = preferred;

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [quote]);

  const handleContinue = () => {
    window.speechSynthesis?.cancel();
    onContinue();
  };

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
        <div className="glass-card border border-success/30 rounded-2xl p-6 w-full max-w-xs flex flex-col items-center text-center gap-4 pointer-events-auto shadow-2xl shadow-success/10">
          {/* Congrats header */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2"
          >
            <PartyPopper size={22} className="text-accent" />
            <h3 className="font-display text-2xl font-bold text-success">
              Correct!
            </h3>
            <PartyPopper size={22} className="text-accent" />
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

            {/* Speaking indicator overlay */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-deep/80 backdrop-blur-sm rounded-full px-2.5 py-1">
              <div className="flex items-end gap-[2px] h-3">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-accent rounded-full"
                    animate={{
                      height: ["4px", "12px", "6px", "10px", "4px"],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-accent font-medium ml-0.5">
                Playing
              </span>
            </div>
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

          {/* Full quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-muted text-xs italic leading-relaxed"
          >
            &ldquo;{quote}&rdquo;
          </motion.p>

          {/* Continue button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
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
