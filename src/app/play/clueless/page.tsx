"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import CluelessInput from "@/components/games/clueless/CluelessInput";
import SimilarityMeter from "@/components/games/clueless/SimilarityMeter";
import CluelessHistory from "@/components/games/clueless/CluelessHistory";
import GameNav from "@/components/layout/GameNav";
import ShareButton from "@/components/shared/ShareButton";
import ConfettiExplosion from "@/components/shared/ConfettiExplosion";
import CountdownTimer from "@/components/shared/CountdownTimer";
import { useGame } from "@/hooks/useGame";
import { useAlreadyPlayed } from "@/hooks/useAlreadyPlayed";
import { useGauntletContext } from "@/context/GauntletContext";
import { useChainContext } from "@/context/ChainContext";
import AlreadyPlayed from "@/components/shared/AlreadyPlayed";
import type { CluelessGuess } from "@/types";
import { pickDaily } from "@/lib/dailyCycle";
import CLUELESS_DATA from "@/data/clueless-words.json";

interface CluelessWord {
  word: string;
  similar: Record<string, number>;
}

function getDailyWord(words: CluelessWord[], date: string): CluelessWord {
  return pickDaily(words, date, "clueless");
}

function getSimilarity(guess: string, dailyWord: CluelessWord): number {
  const lower = guess.toLowerCase();
  if (lower === dailyWord.word.toLowerCase()) return 100;
  if (dailyWord.similar[lower] !== undefined) return dailyWord.similar[lower];
  // Generate a deterministic low score for unknown words
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = ((hash << 5) - hash) + lower.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 20) + 1;
}

export default function CluelessPage() {
  const today = new Date().toISOString().split("T")[0];
  const dailyWord = useMemo(
    () => getDailyWord(CLUELESS_DATA as unknown as CluelessWord[], today),
    [today]
  );
  const { startGame, completeGame } = useGame();
  const { isGauntlet } = useGauntletContext();
  const { isChain } = useChainContext();
  const isSpecialMode = isGauntlet || isChain;
  const { completedState, loading: alreadyPlayedLoading } = useAlreadyPlayed("clueless");

  const [guesses, setGuesses] = useState<CluelessGuess[]>([]);
  const [latestSimilarity, setLatestSimilarity] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startGame("clueless");
  }, []);

  const showError = useCallback((msg: string) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setError(msg);
    errorTimerRef.current = setTimeout(() => setError(null), 3000);
  }, []);

  const handleGuess = useCallback(async (word: string) => {
    if (gameOver) return;
    setError(null);

    if (guesses.some((g) => g.word.toLowerCase() === word.toLowerCase())) {
      showError(`"${word}" has already been guessed`);
      return;
    }

    try {
      const res = await fetch("/api/validate-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      const { valid } = await res.json();
      if (!valid) {
        showError(`"${word}" is not a valid word`);
        return;
      }
    } catch {
      // If validation fails due to network, allow the guess through
    }

    const similarity = getSimilarity(word, dailyWord);
    const newGuess: CluelessGuess = { word, similarity };
    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);
    setLatestSimilarity(similarity);

    if (similarity === 100) {
      setWon(true);
      setGameOver(true);
      completeGame("clueless", "win", newGuesses.length);
    }
  }, [gameOver, guesses, dailyWord, completeGame, showError]);

  const shareText = `\u{1F50D} GAUNTLET \u2014 Clueless\n${won ? `Found it in ${guesses.length} guesses!` : "Still searching..."}\n\nPlay at gauntlet.gg`;

  if (alreadyPlayedLoading) {
    return <div className="pt-6 pb-4"><GameNav title="Clueless" /><div className="text-center py-12 text-muted">Loading...</div></div>;
  }

  if (completedState && !isSpecialMode) {
    return <div className="pt-6 pb-4"><GameNav title="Clueless" /><AlreadyPlayed gameTitle="Clueless" state={completedState} /></div>;
  }

  return (
    <div className="pt-6 pb-4">
      {!isSpecialMode && <GameNav title="Clueless" />}
      {!isSpecialMode && <ConfettiExplosion trigger={won} />}

      <div className="text-center mb-6">
        <p className="text-muted text-sm">Find the secret word by semantic similarity</p>
      </div>

      <div className="glass-card p-4 mb-4 text-center">
        <span className="text-muted text-sm">Guesses: </span>
        <span className="font-display font-bold text-accent">{guesses.length}</span>
      </div>

      {latestSimilarity !== null && <SimilarityMeter similarity={latestSimilarity} />}

      <CluelessInput onGuess={handleGuess} disabled={gameOver} error={error} />

      <CluelessHistory guesses={guesses} targetWord={won ? dailyWord.word : undefined} />

      {gameOver && !isSpecialMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center space-y-4"
        >
          <h3 className="font-display text-xl font-bold text-success">
            You found it!
          </h3>
          <p className="text-muted">
            The word was <span className="text-accent font-bold">{dailyWord.word}</span>
          </p>
          <p className="text-sm text-muted">
            Solved in {guesses.length} guess{guesses.length !== 1 ? "es" : ""}
          </p>
          <ShareButton text={shareText} />
          <CountdownTimer />
        </motion.div>
      )}
    </div>
  );
}
