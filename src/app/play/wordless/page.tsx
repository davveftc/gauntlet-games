"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import WordlessBoard from "@/components/games/wordless/WordlessBoard";
import Keyboard from "@/components/games/wordless/Keyboard";
import GameNav from "@/components/layout/GameNav";
import Button from "@/components/shared/Button";
import ShareButton from "@/components/shared/ShareButton";
import ConfettiExplosion from "@/components/shared/ConfettiExplosion";
import CountdownTimer from "@/components/shared/CountdownTimer";
import { useGame } from "@/hooks/useGame";
import { useAlreadyPlayed } from "@/hooks/useAlreadyPlayed";
import { useGauntletContext } from "@/context/GauntletContext";
import AlreadyPlayed from "@/components/shared/AlreadyPlayed";
import { generateWordlessShareText } from "@/lib/utils";
import type { WordlessTileData, TileState } from "@/types";
import { pickDaily } from "@/lib/dailyCycle";
import WORDS from "@/data/wordless-words.json";

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

function getDailyWord(words: string[], date: string): string {
  return pickDaily(words, date, "wordless").toUpperCase();
}

function evaluateGuess(guess: string, target: string): TileState[] {
  const result: TileState[] = Array(5).fill("absent");
  const targetChars = target.split("");
  const guessChars = guess.split("");

  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = "correct";
      targetChars[i] = "#";
      guessChars[i] = "*";
    }
  }
  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === "*") continue;
    const idx = targetChars.indexOf(guessChars[i]);
    if (idx !== -1) {
      result[i] = "present";
      targetChars[idx] = "#";
    }
  }
  return result;
}

function createEmptyBoard(): WordlessTileData[][] {
  return Array.from({ length: MAX_GUESSES }, () =>
    Array.from({ length: WORD_LENGTH }, () => ({ letter: "", state: "empty" as TileState }))
  );
}

export default function WordlessPage() {
  const today = new Date().toISOString().split("T")[0];
  const targetWord = getDailyWord(WORDS, today);
  const { startGame, completeGame, result } = useGame();
  const { isGauntlet } = useGauntletContext();
  const { completedState, loading: alreadyPlayedLoading } = useAlreadyPlayed("wordless");

  const [board, setBoard] = useState<WordlessTileData[][]>(createEmptyBoard());
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [letterStates, setLetterStates] = useState<Record<string, TileState>>({});
  const [shake, setShake] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState("");
  const [guessStates, setGuessStates] = useState<string[][]>([]);

  useEffect(() => {
    startGame("wordless");
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  const doShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleKey = useCallback((key: string) => {
    if (gameOver) return;
    if (currentCol >= WORD_LENGTH) return;

    setBoard((prev) => {
      const newBoard = prev.map((row) => row.map((tile) => ({ ...tile })));
      newBoard[currentRow][currentCol] = { letter: key, state: "tbd" };
      return newBoard;
    });
    setCurrentCol((c) => c + 1);
  }, [gameOver, currentRow, currentCol]);

  const handleDelete = useCallback(() => {
    if (gameOver) return;
    if (currentCol === 0) return;

    setBoard((prev) => {
      const newBoard = prev.map((row) => row.map((tile) => ({ ...tile })));
      newBoard[currentRow][currentCol - 1] = { letter: "", state: "empty" };
      return newBoard;
    });
    setCurrentCol((c) => c - 1);
  }, [gameOver, currentRow, currentCol]);

  const handleEnter = useCallback(() => {
    if (gameOver) return;
    if (currentCol < WORD_LENGTH) {
      showMessage("Not enough letters");
      doShake();
      return;
    }

    const guess = board[currentRow].map((t) => t.letter).join("").toUpperCase();

    if (!WORDS.map((w: string) => w.toUpperCase()).includes(guess)) {
      showMessage("Not in word list");
      doShake();
      return;
    }

    const states = evaluateGuess(guess, targetWord);

    setBoard((prev) => {
      const newBoard = prev.map((row) => row.map((tile) => ({ ...tile })));
      for (let i = 0; i < WORD_LENGTH; i++) {
        newBoard[currentRow][i].state = states[i];
      }
      return newBoard;
    });

    const newLetterStates = { ...letterStates };
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = guess[i].toLowerCase();
      const priority: Record<string, number> = { correct: 3, present: 2, absent: 1 };
      const existingPriority = priority[newLetterStates[letter]] || 0;
      const newPriority = priority[states[i]] || 0;
      if (newPriority > existingPriority) {
        newLetterStates[letter] = states[i];
      }
    }
    setLetterStates(newLetterStates);

    setGuessStates((prev) => [...prev, states]);

    const isWin = states.every((s) => s === "correct");
    const isLoss = currentRow >= MAX_GUESSES - 1 && !isWin;

    if (isWin) {
      setWon(true);
      setGameOver(true);
      completeGame("wordless", "win", currentRow + 1);
    } else if (isLoss) {
      setGameOver(true);
      completeGame("wordless", "loss");
      showMessage(`The word was ${targetWord}`);
    } else {
      setCurrentRow((r) => r + 1);
      setCurrentCol(0);
    }
  }, [gameOver, currentCol, currentRow, board, letterStates, targetWord, completeGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") handleEnter();
      else if (e.key === "Backspace") handleDelete();
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleEnter, handleDelete, handleKey]);

  const puzzleNumber = Math.abs(
    today.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0) % 9999
  );

  if (alreadyPlayedLoading) {
    return <div className="pt-6 pb-4"><GameNav title="Wordless" /><div className="text-center py-12 text-muted">Loading...</div></div>;
  }

  if (completedState && !isGauntlet) {
    return <div className="pt-6 pb-4"><GameNav title="Wordless" /><AlreadyPlayed gameTitle="Wordless" state={completedState} /></div>;
  }

  return (
    <div className="pt-6 pb-4">
      {!isGauntlet && <GameNav title="Wordless" />}
      {!isGauntlet && <ConfettiExplosion trigger={won} />}

      <div className="text-center mb-6">
        <p className="text-muted text-sm">Guess the 5-letter word in 6 tries</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-center mb-4 py-2 px-4 bg-surface rounded-xl text-sm font-medium"
        >
          {message}
        </motion.div>
      )}

      <WordlessBoard board={board} currentRow={currentRow} shake={shake} />
      <Keyboard
        onKey={handleKey}
        onEnter={handleEnter}
        onDelete={handleDelete}
        letterStates={letterStates}
      />

      {gameOver && !isGauntlet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center space-y-4"
        >
          <h3 className="font-display text-xl font-bold">
            {won ? (
              <span className="text-success">You got it!</span>
            ) : (
              <span className="text-error">Better luck tomorrow</span>
            )}
          </h3>
          <p className="text-muted text-sm">The word was <span className="text-accent font-bold">{targetWord}</span></p>
          <ShareButton
            text={generateWordlessShareText(puzzleNumber, guessStates, won, MAX_GUESSES)}
          />
          <CountdownTimer />
        </motion.div>
      )}
    </div>
  );
}
