"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import SpellingBeeAudio from "@/components/games/spellingbee/SpellingBeeAudio";
import SpellingBeeInput from "@/components/games/spellingbee/SpellingBeeInput";
import SpellingBeeProgress from "@/components/games/spellingbee/SpellingBeeProgress";
import GameNav from "@/components/layout/GameNav";
import ShareButton from "@/components/shared/ShareButton";
import ConfettiExplosion from "@/components/shared/ConfettiExplosion";
import CountdownTimer from "@/components/shared/CountdownTimer";
import { useGame } from "@/hooks/useGame";
import { useGauntletContext } from "@/context/GauntletContext";
import SPELLING_DATA from "@/data/spellingbee-words.json";

interface SpellingWord {
  word: string;
  difficulty: number;
  audioUrl: string;
  definition?: string;
}

interface SpellingSet {
  words: SpellingWord[];
}

const WORDS_PER_GAME = 5;

function getDailySet(sets: SpellingSet[], date: string): SpellingWord[] {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) - hash) + date.charCodeAt(i);
    hash |= 0;
  }
  const set = sets[Math.abs(hash) % sets.length];
  return set.words.slice(0, WORDS_PER_GAME);
}

export default function SpellingBeePage() {
  const today = new Date().toISOString().split("T")[0];
  const dailyWords = useMemo(
    () => getDailySet(SPELLING_DATA as SpellingSet[], today),
    [today]
  );
  const { startGame, completeGame } = useGame();
  const { isGauntlet } = useGauntletContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<("correct" | "incorrect" | "pending")[]>([]);
  const [lastAnswer, setLastAnswer] = useState<{ correct: boolean; word: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    startGame("spellingbee");
  }, []);

  const currentWord = dailyWords[currentIndex];

  const handleSubmit = (spelling: string) => {
    if (gameOver || !currentWord) return;

    const isCorrect = spelling.toLowerCase() === currentWord.word.toLowerCase();
    const newResults = [...results, isCorrect ? "correct" as const : "incorrect" as const];
    setResults(newResults);
    setLastAnswer({ correct: isCorrect, word: currentWord.word });

    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    setTimeout(() => {
      setLastAnswer(null);

      // In gauntlet mode, any wrong word = instant loss
      if (isGauntlet && !isCorrect) {
        setGameOver(true);
        completeGame("spellingbee", "loss", newScore);
        return;
      }

      if (currentIndex >= WORDS_PER_GAME - 1) {
        setGameOver(true);
        completeGame("spellingbee", newScore >= 3 ? "win" : "loss", newScore);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 2000);
  };

  const difficultyStars = currentWord
    ? Array.from({ length: 5 }, (_, i) => (i < currentWord.difficulty ? "\u2605" : "\u2606")).join("")
    : "";

  const shareText = `\u{1F41D} GAUNTLET \u2014 Spelling Bee\nScore: ${score}/${WORDS_PER_GAME}\n${results.map((r) => (r === "correct" ? "\u2705" : "\u274C")).join("")}\n\nPlay at gauntlet.gg`;

  return (
    <div className="pt-6 pb-4">
      {!isGauntlet && <GameNav />}
      {!isGauntlet && <ConfettiExplosion trigger={score === WORDS_PER_GAME && gameOver} />}

      <div className="text-center mb-6">
        <h2 className="font-display text-4xl lg:text-5xl font-bold mb-1">Spelling Bee</h2>
        <p className="text-muted text-sm">Spell 5 words, each harder than the last</p>
      </div>

      <SpellingBeeProgress
        total={WORDS_PER_GAME}
        results={results}
        currentIndex={currentIndex}
      />

      {!gameOver && currentWord && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-accent text-sm mb-4">Difficulty: {difficultyStars}</p>
            <SpellingBeeAudio word={currentWord.word} audioUrl={currentWord.audioUrl} />
            <p className="text-muted text-xs mt-3">Tap to hear the word</p>
            {currentWord.definition && (
              <p className="text-muted text-sm mt-2 italic">&ldquo;{currentWord.definition}&rdquo;</p>
            )}
          </div>

          {lastAnswer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-center p-4 rounded-xl ${
                lastAnswer.correct
                  ? "bg-success/10 border border-success/30"
                  : "bg-error/10 border border-error/30"
              }`}
            >
              <p className={`font-display font-bold text-lg ${lastAnswer.correct ? "text-success" : "text-error"}`}>
                {lastAnswer.correct ? "Correct!" : "Incorrect"}
              </p>
              {!lastAnswer.correct && (
                <p className="text-muted text-sm mt-1">
                  Correct spelling: <span className="text-accent font-bold">{lastAnswer.word}</span>
                </p>
              )}
            </motion.div>
          )}

          {!lastAnswer && (
            <SpellingBeeInput onSubmit={handleSubmit} />
          )}
        </div>
      )}

      {gameOver && !isGauntlet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h3 className="font-display text-3xl font-bold">
            {score === WORDS_PER_GAME ? (
              <span className="text-success">Perfect!</span>
            ) : (
              <span className="text-accent">{score}/{WORDS_PER_GAME}</span>
            )}
          </h3>
          <p className="text-muted">
            You spelled {score} out of {WORDS_PER_GAME} correctly
          </p>

          <div className="space-y-2">
            {dailyWords.map((w, i) => (
              <div
                key={w.word}
                className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
                  results[i] === "correct"
                    ? "bg-success/10 border border-success/30"
                    : "bg-error/10 border border-error/30"
                }`}
              >
                <span className={results[i] === "correct" ? "text-success" : "text-error"}>
                  {results[i] === "correct" ? "\u2713" : "\u2717"}
                </span>
                <span className="font-medium">{w.word}</span>
                <span className="text-xs text-muted ml-auto">{"★".repeat(w.difficulty)}</span>
              </div>
            ))}
          </div>

          <ShareButton text={shareText} />
          <CountdownTimer />
        </motion.div>
      )}
    </div>
  );
}
