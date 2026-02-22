"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MoreLessCard from "./MoreLessCard";
import Button from "@/components/shared/Button";
import type { MoreLessPair } from "@/types";

interface MoreLessGameProps {
  pairs: MoreLessPair[];
  onComplete: (score: number) => void;
}

export default function MoreLessGame({ pairs, onComplete }: MoreLessGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const currentPair = pairs[currentIndex];

  const handleChoice = (choice: "higher" | "lower") => {
    if (showResult || isGameOver) return;

    const isHigher = currentPair.itemB.value > currentPair.itemA.value;
    const isEqual = currentPair.itemB.value === currentPair.itemA.value;
    const correct = isEqual || (choice === "higher" ? isHigher : !isHigher);

    setShowResult(true);
    setLastCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);
    }

    setTimeout(() => {
      if (!correct || currentIndex >= pairs.length - 1) {
        setIsGameOver(true);
        onComplete(correct ? score + 1 : score);
      } else {
        setCurrentIndex((i) => i + 1);
        setShowResult(false);
        setLastCorrect(null);
      }
    }, 1500);
  };

  if (!currentPair) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted text-sm">Round {currentIndex + 1}/{pairs.length}</span>
        <span className="font-display font-bold text-accent">Score: {score}</span>
      </div>

      <div className="flex gap-4 mb-6">
        <MoreLessCard item={currentPair.itemA} showValue={true} />
        <MoreLessCard item={currentPair.itemB} showValue={showResult} />
      </div>

      {showResult && lastCorrect !== null && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`text-center text-4xl font-display font-bold mb-4 ${
            lastCorrect ? "text-success" : "text-error"
          }`}
        >
          {lastCorrect ? "Correct!" : "Wrong!"}
        </motion.div>
      )}

      {!showResult && !isGameOver && (
        <div className="flex gap-4">
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => handleChoice("higher")}
          >
            Higher
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => handleChoice("lower")}
          >
            Lower
          </Button>
        </div>
      )}
    </div>
  );
}
