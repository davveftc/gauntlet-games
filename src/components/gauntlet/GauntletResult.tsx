"use client";
import { motion } from "framer-motion";
import { Swords, Skull } from "lucide-react";
import Button from "@/components/shared/Button";
import ShareButton from "@/components/shared/ShareButton";
import CountdownTimer from "@/components/shared/CountdownTimer";
import ConfettiExplosion from "@/components/shared/ConfettiExplosion";
import { generateGauntletShareText } from "@/lib/utils";
import type { GameId } from "@/types";
import Link from "next/link";

interface GauntletResultProps {
  results: Record<string, "win" | "loss">;
  survived: boolean;
  gameOrder: GameId[];
  multiplier: number;
  totalPoints: number;
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

export default function GauntletResult({
  results,
  survived,
  gameOrder,
  multiplier,
  totalPoints,
}: GauntletResultProps) {
  const completedCount = Object.values(results).filter((r) => r === "win").length;
  const shareText = generateGauntletShareText(survived, completedCount, gameOrder.length, totalPoints);

  return (
    <div className="pt-6 text-center">
      <ConfettiExplosion trigger={survived} />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className="mb-6"
      >
        {survived ? (
          <div className="w-24 h-24 mx-auto rounded-full bg-success/20 border-2 border-success flex items-center justify-center mb-4">
            <Swords size={48} className="text-success" />
          </div>
        ) : (
          <div className="w-24 h-24 mx-auto rounded-full bg-error/20 border-2 border-error flex items-center justify-center mb-4">
            <Skull size={48} className="text-error" />
          </div>
        )}
      </motion.div>

      <h1
        className={`font-display text-3xl font-bold mb-2 ${
          survived ? "neon-text-gold" : "neon-text-pink"
        }`}
      >
        {survived ? "YOU SURVIVED!" : "ELIMINATED"}
      </h1>

      {survived ? (
        <div className="mb-6">
          <p className="text-muted mb-3">
            You conquered all {gameOrder.length} games!
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-block px-5 py-3 rounded-xl bg-accent/15 border border-accent/30"
          >
            <p className="font-display text-3xl font-bold text-accent">
              {totalPoints}
              <span className="text-lg text-accent/60 ml-1">pts</span>
            </p>
            <p className="text-xs text-muted mt-1">
              {multiplier}× multiplier applied
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-muted mb-1">
            You made it through {completedCount} of {gameOrder.length} games
          </p>
          <p className="font-display text-2xl font-bold text-error/70 mb-4">
            0 points
          </p>
          <CountdownTimer />
        </div>
      )}

      <div className="space-y-2 mb-8 max-w-xs mx-auto">
        {gameOrder.map((gameId) => {
          const result = results[gameId];
          return (
            <motion.div
              key={gameId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between py-2 px-4 rounded-lg ${
                result === "win"
                  ? "bg-success/10 border border-success/30"
                  : result === "loss"
                  ? "bg-error/10 border border-error/30"
                  : "bg-surface/30 border border-dim/20"
              }`}
            >
              <span className="text-sm font-medium">{GAME_NAMES[gameId]}</span>
              <span
                className={`text-sm font-bold ${
                  result === "win"
                    ? "text-success"
                    : result === "loss"
                    ? "text-error"
                    : "text-dim"
                }`}
              >
                {result === "win"
                  ? "Cleared"
                  : result === "loss"
                  ? "Failed"
                  : "-"}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-3">
        <ShareButton text={shareText} />
        <Link href="/">
          <Button variant="ghost" size="md">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
