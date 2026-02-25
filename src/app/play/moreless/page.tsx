"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X as XIcon } from "lucide-react";
import MoreLessCard from "@/components/games/moreless/MoreLessCard";
import GameNav from "@/components/layout/GameNav";
import ShareButton from "@/components/shared/ShareButton";
import ConfettiExplosion from "@/components/shared/ConfettiExplosion";
import CountdownTimer from "@/components/shared/CountdownTimer";
import { useGame } from "@/hooks/useGame";
import { useAlreadyPlayed } from "@/hooks/useAlreadyPlayed";
import { useGauntletContext } from "@/context/GauntletContext";
import { useChainContext } from "@/context/ChainContext";
import AlreadyPlayed from "@/components/shared/AlreadyPlayed";
import type { MoreLessPair, MoreLessItem } from "@/types";
import PAIRS_DATA from "@/data/moreless-pairs.json";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const CATEGORIES = [
  "Google Searches",
  "Monthly Listeners",
  "Movie Ratings",
] as const;

const ROUNDS_PER_TAB = 10;
const ITEMS_PER_TAB = ROUNDS_PER_TAB + 1; // 11 items → 10 comparisons
const TOTAL_TABS = CATEGORIES.length;
const MAX_SCORE = ROUNDS_PER_TAB * TOTAL_TABS;

const CATEGORY_QUESTIONS: Record<string, { before: string; keyword: string; after: string }> = {
  "Google Searches": { before: "Which gets ", keyword: "MORE", after: " Google searches?" },
  "Monthly Listeners": { before: "Who has ", keyword: "MORE", after: " monthly listeners?" },
  "Movie Ratings": { before: "Which has the ", keyword: "HIGHER", after: " IMDb rating?" },
};

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
interface TabState {
  roundIndex: number;
  score: number;
  completed: boolean;
  failed: boolean;
  showingResult: boolean;
  selectedSide: "left" | "right" | null;
  championIdx: number; // index into the items array
}

/* ------------------------------------------------------------------ */
/*  Seeded RNG                                                         */
/* ------------------------------------------------------------------ */
function createRng(seed: number) {
  let s = Math.abs(seed) | 1;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function hashDate(date: string): number {
  let h = 0;
  for (let i = 0; i < date.length; i++) {
    h = ((h << 5) - h) + date.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/* ------------------------------------------------------------------ */
/*  Flatten pairs → items, then pick daily chain                       */
/* ------------------------------------------------------------------ */
function extractItems(
  allPairs: MoreLessPair[],
  category: string
): MoreLessItem[] {
  const items: MoreLessItem[] = [];
  const seen = new Set<string>();
  for (const pair of allPairs) {
    if (pair.itemA.category !== category) continue;
    for (const item of [pair.itemA, pair.itemB]) {
      if (!seen.has(item.name)) {
        items.push(item);
        seen.add(item.name);
      }
    }
  }
  return items;
}

function getDailyItems(
  allPairs: MoreLessPair[],
  date: string
): Record<string, MoreLessItem[]> {
  const rng = createRng(hashDate(date + "-v2"));
  const result: Record<string, MoreLessItem[]> = {};

  for (const cat of CATEGORIES) {
    const pool = extractItems(allPairs, cat);
    const shuffled = [...pool].sort(() => rng() - 0.5);
    result[cat] = shuffled.slice(0, ITEMS_PER_TAB);
  }

  return result;
}

function createInitialTabStates(): TabState[] {
  return Array.from({ length: TOTAL_TABS }, () => ({
    roundIndex: 0,
    score: 0,
    completed: false,
    failed: false,
    showingResult: false,
    selectedSide: null,
    championIdx: 0,
  }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MoreLessPage() {
  const today = new Date().toISOString().split("T")[0];
  const dailyItems = useMemo(
    () => getDailyItems(PAIRS_DATA as MoreLessPair[], today),
    [today]
  );
  const { startGame, completeGame } = useGame();
  const { isGauntlet } = useGauntletContext();
  const { isChain } = useChainContext();
  const isSpecialMode = isGauntlet || isChain;
  const { completedState, loading: alreadyPlayedLoading } = useAlreadyPlayed("moreless");

  const [activeTab, setActiveTab] = useState(0);
  const [tabStates, setTabStates] = useState<TabState[]>(
    createInitialTabStates
  );
  const [gameOver, setGameOver] = useState(false);

  const currentCategory = CATEGORIES[activeTab];
  const currentState = tabStates[activeTab];
  const items = dailyItems[currentCategory] || [];

  const isFirstRound = currentState.roundIndex === 0;
  const leftIdx = isFirstRound ? 0 : currentState.championIdx;
  const rightIdx = currentState.roundIndex + 1;
  const leftItem = items[leftIdx];
  const rightItem = items[rightIdx];

  const totalCorrect = tabStates.reduce((sum, t) => sum + t.score, 0);

  useEffect(() => {
    startGame("moreless");
  }, []);

  // Check game over
  useEffect(() => {
    if (gameOver) return;
    if (tabStates.every((t) => t.completed)) {
      const total = tabStates.reduce((sum, t) => sum + t.score, 0);
      setGameOver(true);
      completeGame("moreless", total === MAX_SCORE ? "win" : "loss", total);
    }
  }, [tabStates, gameOver, completeGame]);

  /* ---- handle user picking a card ---- */
  const handlePick = (side: "left" | "right") => {
    if (
      gameOver ||
      currentState.completed ||
      currentState.showingResult ||
      !leftItem ||
      !rightItem
    )
      return;

    const pickedItem = side === "left" ? leftItem : rightItem;
    const otherItem = side === "left" ? rightItem : leftItem;
    const correct = pickedItem.value >= otherItem.value;

    // Winner = whichever has the higher value → becomes champion
    const newChampIdx =
      leftItem.value >= rightItem.value ? leftIdx : rightIdx;

    const tabIdx = activeTab;

    // Show result
    setTabStates((prev) => {
      const next = [...prev];
      next[tabIdx] = {
        ...next[tabIdx],
        showingResult: true,
        selectedSide: side,
      };
      return next;
    });

    // Auto-advance
    setTimeout(() => {
      setTabStates((prev) => {
        const next = [...prev];
        const state = next[tabIdx];

        if (!correct) {
          // In gauntlet mode, any wrong answer = instant loss
          if (isSpecialMode) {
            setGameOver(true);
            const total = next.reduce((sum, t) => sum + t.score, 0);
            completeGame("moreless", "loss", total);
          }
          // Failed → category over
          next[tabIdx] = {
            ...state,
            completed: true,
            failed: true,
            showingResult: false,
            selectedSide: null,
          };
        } else {
          // Correct → advance chain
          const nextRound = state.roundIndex + 1;
          const isDone = nextRound >= ROUNDS_PER_TAB;

          next[tabIdx] = {
            ...state,
            roundIndex: isDone ? state.roundIndex : nextRound,
            completed: isDone,
            failed: false,
            showingResult: false,
            selectedSide: null,
            championIdx: newChampIdx,
            score: state.score + 1,
          };
        }

        return next;
      });
    }, 1800);
  };

  /* ---- card result helpers ---- */
  const getCardResult = (
    side: "left" | "right"
  ): "correct" | "wrong" | null => {
    if (!currentState.showingResult || !leftItem || !rightItem) return null;
    const item = side === "left" ? leftItem : rightItem;
    const other = side === "left" ? rightItem : leftItem;
    return item.value >= other.value ? "correct" : "wrong";
  };

  const lastAnswerCorrect = (): boolean => {
    if (!currentState.showingResult || !leftItem || !rightItem) return false;
    const picked =
      currentState.selectedSide === "left" ? leftItem : rightItem;
    const other =
      currentState.selectedSide === "left" ? rightItem : leftItem;
    return picked.value >= other.value;
  };

  /* ---- share text ---- */
  const shareText = `\u{1F4CA} GAUNTLET \u2014 More/Less\nScore: ${totalCorrect}/${MAX_SCORE}\n${CATEGORIES.map(
    (cat, i) => `${cat}: ${tabStates[i].score}/${ROUNDS_PER_TAB}`
  ).join("\n")}\n\nPlay at gauntlet.gg`;

  /* ================================================================ */
  if (alreadyPlayedLoading) {
    return <div className="pt-6 pb-4"><GameNav title="More / Less" /><div className="text-center py-12 text-muted">Loading...</div></div>;
  }

  if (completedState && !isSpecialMode) {
    return <div className="pt-6 pb-4"><GameNav title="More / Less" /><AlreadyPlayed gameTitle="More / Less" state={completedState} /></div>;
  }

  return (
    <div className="flex flex-col pt-4 pb-2 min-h-[calc(100dvh-5rem)]">
      {!isSpecialMode && <GameNav title="More / Less" />}
      {!isSpecialMode && <ConfettiExplosion trigger={gameOver && totalCorrect === MAX_SCORE} />}

      <p className="text-muted text-sm text-center mb-3">Pick which has more — one wrong answer ends the streak</p>

      {/* ---- Category tabs ---- */}
      <div className="flex gap-1 mb-3">
        {CATEGORIES.map((cat, i) => {
          const state = tabStates[i];
          const isActive = i === activeTab && !gameOver;

          return (
            <button
              key={cat}
              onClick={() => !gameOver && setActiveTab(i)}
              disabled={gameOver}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                isActive
                  ? "bg-primary/25 border border-accent/50 text-accent"
                  : state.completed
                  ? state.score === ROUNDS_PER_TAB
                    ? "bg-success/10 border border-success/30 text-success"
                    : state.failed
                    ? "bg-error/10 border border-error/30 text-error/70"
                    : "bg-surface/30 border border-dim/15 text-muted"
                  : "bg-surface/30 border border-dim/15 text-muted hover:bg-surface/50"
              } ${gameOver ? "cursor-default" : "cursor-pointer"}`}
            >
              <span className="truncate">{cat}</span>
              {state.completed &&
                (state.score === ROUNDS_PER_TAB ? (
                  <Check size={11} className="shrink-0" />
                ) : (
                  <span className="text-[9px] shrink-0 opacity-70">
                    {state.score}/{ROUNDS_PER_TAB}
                  </span>
                ))}
            </button>
          );
        })}
      </div>

      {/* ---- Active gameplay ---- */}
      {!gameOver && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col flex-1 min-h-0"
          >
            {!currentState.completed && leftItem && rightItem && (
              <>
                {/* ---- Progress bar + counter ---- */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 rounded-full bg-dim/20 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={false}
                      animate={{
                        width: `${
                          (currentState.score / ROUNDS_PER_TAB) * 100
                        }%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-[10px] text-muted shrink-0">
                    {currentState.roundIndex + 1}/{ROUNDS_PER_TAB}
                  </span>
                  <span className="text-[10px] text-accent font-medium shrink-0">
                    {currentState.score} streak
                  </span>
                </div>

                {/* ---- Question ---- */}
                <p className="text-center text-3xl lg:text-4xl font-display font-bold text-white/80 mt-16 mb-16">
                  {CATEGORY_QUESTIONS[currentCategory].before}
                  <span className="text-accent">{CATEGORY_QUESTIONS[currentCategory].keyword}</span>
                  {CATEGORY_QUESTIONS[currentCategory].after}
                </p>

                {/* ---- Cards ---- */}
                <div className="flex gap-3">
                  {/* Left card — champion (or first item in round 0) */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={leftIdx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      className="flex-1 min-w-0"
                    >
                      <MoreLessCard
                        item={leftItem}
                        showValue={
                          isFirstRound
                            ? currentState.showingResult
                            : true
                        }
                        onClick={() => handlePick("left")}
                        disabled={currentState.showingResult}
                        result={getCardResult("left")}
                        isSelected={currentState.selectedSide === "left"}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Right card — challenger */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={rightIdx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.25 }}
                      className="flex-1 min-w-0"
                    >
                      <MoreLessCard
                        item={rightItem}
                        showValue={currentState.showingResult}
                        onClick={() => handlePick("right")}
                        disabled={currentState.showingResult}
                        result={getCardResult("right")}
                        isSelected={currentState.selectedSide === "right"}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* ---- Result feedback ---- */}
                {currentState.showingResult && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`text-center text-xl font-display font-bold mt-3 ${
                      lastAnswerCorrect() ? "text-success" : "text-error"
                    }`}
                  >
                    {lastAnswerCorrect() ? "Correct!" : "Wrong!"}
                  </motion.div>
                )}
              </>
            )}

            {/* ---- Tab completed ---- */}
            {currentState.completed && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                {currentState.failed ? (
                  <>
                    <h3 className="font-display text-2xl font-bold mb-1 text-error">
                      Streak ended!
                    </h3>
                    <p className="text-muted text-sm">
                      You got{" "}
                      <span className="text-accent font-bold">
                        {currentState.score}
                      </span>{" "}
                      in a row
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-display text-2xl font-bold mb-1 text-success">
                      Perfect!
                    </h3>
                    <p className="text-muted text-sm">
                      {ROUNDS_PER_TAB}/{ROUNDS_PER_TAB} correct
                    </p>
                  </>
                )}
                <p className="text-muted text-xs mt-2">
                  {tabStates.filter((t) => t.completed).length < TOTAL_TABS
                    ? "Pick another category to continue"
                    : "All categories complete!"}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ---- Game over summary ---- */}
      {gameOver && !isSpecialMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center gap-3"
        >
          <h3 className="font-display text-3xl font-bold">
            {totalCorrect === MAX_SCORE ? (
              <span className="text-success">Perfect Score!</span>
            ) : (
              <span className="text-accent">
                {totalCorrect}/{MAX_SCORE}
              </span>
            )}
          </h3>
          <p className="text-muted text-sm">
            You got {totalCorrect} out of {MAX_SCORE} correct
          </p>

          <div className="space-y-1.5 text-left w-full">
            {CATEGORIES.map((cat, i) => {
              const state = tabStates[i];
              return (
                <div
                  key={cat}
                  className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-sm ${
                    state.score === ROUNDS_PER_TAB
                      ? "bg-success/10 border border-success/30"
                      : state.failed
                      ? "bg-error/10 border border-error/30"
                      : "bg-surface/30 border border-dim/15"
                  }`}
                >
                  <span
                    className={
                      state.score === ROUNDS_PER_TAB
                        ? "text-success"
                        : "text-error"
                    }
                  >
                    {state.score === ROUNDS_PER_TAB ? "\u2713" : "\u2717"}
                  </span>
                  <span className="font-medium truncate flex-1">{cat}</span>
                  <span className="text-[10px] text-dim shrink-0 px-1.5 py-0.5 rounded-full bg-dim/10">
                    {state.score}/{ROUNDS_PER_TAB}
                  </span>
                </div>
              );
            })}
          </div>

          <ShareButton text={shareText} />
          <CountdownTimer />
        </motion.div>
      )}
    </div>
  );
}
