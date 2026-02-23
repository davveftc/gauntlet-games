"use client";
import { motion } from "framer-motion";
import CountdownTimer from "./CountdownTimer";
import type { GameState } from "@/types";

interface AlreadyPlayedProps {
  gameTitle: string;
  state: GameState;
}

export default function AlreadyPlayed({ gameTitle, state }: AlreadyPlayedProps) {
  const won = state.result === "win";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center gap-4 py-12"
    >
      <h2 className="font-display text-4xl lg:text-5xl font-bold">{gameTitle}</h2>
      <div className="glass-card p-6 w-full max-w-sm space-y-4">
        <h3 className="font-display text-2xl font-bold">
          {won ? (
            <span className="text-success">You won today!</span>
          ) : (
            <span className="text-error">Better luck tomorrow</span>
          )}
        </h3>
        {state.score !== undefined && state.score !== null && (
          <p className="text-muted text-sm">
            Score: <span className="text-accent font-bold">{state.score}</span>
          </p>
        )}
        <div className="pt-2 border-t border-dim/15">
          <CountdownTimer />
        </div>
      </div>
    </motion.div>
  );
}
