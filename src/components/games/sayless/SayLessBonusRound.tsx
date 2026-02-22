"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Award } from "lucide-react";
import Button from "@/components/shared/Button";
import type { MovieQuote } from "@/types";

interface RoundInfo {
  movie: MovieQuote;
  won: boolean;
}

interface SayLessBonusRoundProps {
  rounds: RoundInfo[];
  onComplete: (bonusCorrect: number) => void;
}

export default function SayLessBonusRound({ rounds, onComplete }: SayLessBonusRoundProps) {
  const [guesses, setGuesses] = useState<string[]>(() => new Array(rounds.length).fill(""));
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const handleSubmit = () => {
    const newResults = rounds.map((round, i) => {
      const guess = guesses[i].trim().toLowerCase();
      const actual = round.movie.actor.toLowerCase();
      // Match by full name or last name
      return actual === guess || actual.split(" ").pop() === guess;
    });
    setResults(newResults);
    setSubmitted(true);
  };

  const bonusCorrect = results.filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Award size={20} className="text-accent" />
          <h3 className="font-display text-xl font-bold text-accent">Bonus Round</h3>
          <Award size={20} className="text-accent" />
        </div>
        <p className="text-muted text-sm">
          {submitted
            ? `You got ${bonusCorrect} actor${bonusCorrect !== 1 ? "s" : ""} correct!`
            : "Guess the actor who said each quote for bonus points!"}
        </p>
      </div>

      <div className="space-y-3">
        {rounds.map((round, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl border ${
              submitted
                ? results[i]
                  ? "bg-success/10 border-success/30"
                  : "bg-error/10 border-error/30"
                : "bg-[rgba(26,16,64,0.7)] border-primary/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{round.movie.movie}</p>
                <p className="text-[10px] text-muted">{round.movie.year} &middot; {round.movie.genre}</p>
                <p className="text-xs text-muted/70 italic mt-1">&ldquo;{round.movie.quote}&rdquo;</p>
              </div>
              {submitted && (
                results[i]
                  ? <Check size={16} className="text-success shrink-0" />
                  : <X size={16} className="text-error shrink-0" />
              )}
            </div>

            {submitted ? (
              <div className="text-sm">
                {results[i] ? (
                  <span className="text-success font-medium">{round.movie.actor}</span>
                ) : (
                  <div>
                    {guesses[i].trim() && (
                      <span className="text-error line-through mr-2">{guesses[i]}</span>
                    )}
                    <span className="text-success font-medium">{round.movie.actor}</span>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Actor name..."
                value={guesses[i]}
                onChange={(e) => {
                  const newGuesses = [...guesses];
                  newGuesses[i] = e.target.value;
                  setGuesses(newGuesses);
                }}
                className="w-full bg-deep/50 border border-primary/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-dim focus:outline-none focus:border-primary"
              />
            )}
          </div>
        ))}
      </div>

      {!submitted ? (
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          className="w-full"
        >
          Submit Actors
        </Button>
      ) : (
        <Button
          variant="primary"
          size="md"
          onClick={() => onComplete(bonusCorrect)}
          className="w-full"
        >
          Finish Game
        </Button>
      )}
    </motion.div>
  );
}
