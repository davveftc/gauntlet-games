"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X as XIcon, Eye, HelpCircle } from "lucide-react";
import FacelessImage from "@/components/games/faceless/FacelessImage";
import FacelessInput from "@/components/games/faceless/FacelessInput";
import GameNav from "@/components/layout/GameNav";
import Button from "@/components/shared/Button";
import ShareButton from "@/components/shared/ShareButton";
import ConfettiExplosion from "@/components/shared/ConfettiExplosion";
import CountdownTimer from "@/components/shared/CountdownTimer";
import { useGame } from "@/hooks/useGame";
import { useAlreadyPlayed } from "@/hooks/useAlreadyPlayed";
import { useGauntletContext } from "@/context/GauntletContext";
import { useChainContext } from "@/context/ChainContext";
import AlreadyPlayed from "@/components/shared/AlreadyPlayed";
import type { FacelessCelebrity } from "@/types";
import CELEBS_DATA from "@/data/faceless-celebrities.json";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const CELEBS_PER_DAY = 6;
const MAX_ATTEMPTS = 3;
const MAX_SCORE = CELEBS_PER_DAY * MAX_ATTEMPTS; // 18
const POINTS_BY_ATTEMPT = [3, 2, 1];

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
/*  Wikipedia image fetching (high-res for zoom)                       */
/* ------------------------------------------------------------------ */
const imageCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

function useWikiImage(wikiQuery: string) {
  const [url, setUrl] = useState<string | null>(
    imageCache.get(wikiQuery) ?? null
  );
  const [loading, setLoading] = useState(!imageCache.has(wikiQuery));

  useEffect(() => {
    if (imageCache.has(wikiQuery)) {
      setUrl(imageCache.get(wikiQuery)!);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchImage() {
      if (!pendingRequests.has(wikiQuery)) {
        const promise = fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiQuery)}`
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            const orig = data?.originalimage;
            const thumb = data?.thumbnail;

            // Reject wide landscape images (action shots, group photos)
            // Only accept portrait or roughly-square images (height/width >= 0.75)
            let imgUrl: string | null = null;
            if (orig?.source && orig.height && orig.width) {
              const ratio = orig.height / orig.width;
              if (ratio >= 0.75) {
                imgUrl = orig.source;
              }
            }
            // Fall back to thumbnail if original was rejected or missing
            if (!imgUrl && thumb?.source && thumb.height && thumb.width) {
              const ratio = thumb.height / thumb.width;
              if (ratio >= 0.75) {
                imgUrl = thumb.source;
              }
            }

            imageCache.set(wikiQuery, imgUrl);
            pendingRequests.delete(wikiQuery);
            return imgUrl;
          })
          .catch(() => {
            imageCache.set(wikiQuery, null);
            pendingRequests.delete(wikiQuery);
            return null;
          });
        pendingRequests.set(wikiQuery, promise);
      }

      const result = await pendingRequests.get(wikiQuery)!;
      if (!cancelled) {
        setUrl(result);
        setLoading(false);
      }
    }

    fetchImage();
    return () => {
      cancelled = true;
    };
  }, [wikiQuery]);

  return { url, loading };
}

/* ------------------------------------------------------------------ */
/*  Daily celeb selection                                              */
/* ------------------------------------------------------------------ */
interface DailyCeleb {
  celeb: FacelessCelebrity;
  focalPoint: { x: number; y: number };
}

function getDailyCelebs(
  celebs: FacelessCelebrity[],
  date: string
): DailyCeleb[] {
  const rng = createRng(hashDate(date));
  const shuffled = [...celebs].sort(() => rng() - 0.5);
  return shuffled.slice(0, CELEBS_PER_DAY).map((celeb) => ({
    celeb,
    focalPoint: {
      x: 40 + rng() * 20, // 40-60% — center horizontal (face area)
      y: 15 + rng() * 25, // 15-40% — upper third (where faces sit in portraits)
    },
  }));
}

/* ------------------------------------------------------------------ */
/*  Per-round state                                                    */
/* ------------------------------------------------------------------ */
interface RoundState {
  attemptIndex: number; // how many attempts used (0-4)
  guesses: string[];
  hintUsed: boolean;
  completed: boolean;
  won: boolean;
  score: number;
}

function createInitialRoundStates(): RoundState[] {
  return Array.from({ length: CELEBS_PER_DAY }, () => ({
    attemptIndex: 0,
    guesses: [],
    hintUsed: false,
    completed: false,
    won: false,
    score: 0,
  }));
}

/* ------------------------------------------------------------------ */
/*  Image prefetcher component (invisible)                             */
/* ------------------------------------------------------------------ */
function ImagePrefetcher({
  wikiQuery,
  onLoaded,
}: {
  wikiQuery: string;
  onLoaded: (url: string | null, loading: boolean) => void;
}) {
  const { url, loading } = useWikiImage(wikiQuery);
  useEffect(() => {
    onLoaded(url, loading);
  }, [url, loading, onLoaded]);
  return null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function FacelessPage() {
  const today = new Date().toISOString().split("T")[0];
  const dailyCelebs = useMemo(
    () => getDailyCelebs(CELEBS_DATA as FacelessCelebrity[], today),
    [today]
  );
  const { startGame, completeGame } = useGame();
  const { isGauntlet } = useGauntletContext();
  const { isChain } = useChainContext();
  const isSpecialMode = isGauntlet || isChain;
  const { completedState, loading: alreadyPlayedLoading } = useAlreadyPlayed("faceless");

  const allCelebNames = useMemo(
    () => (CELEBS_DATA as FacelessCelebrity[]).map((c) => c.name),
    []
  );

  const [activeTab, setActiveTab] = useState(0);
  const [roundStates, setRoundStates] = useState<RoundState[]>(
    createInitialRoundStates
  );
  const [gameOver, setGameOver] = useState(false);

  // Image state for the active round
  const currentCeleb = dailyCelebs[activeTab];
  const currentState = roundStates[activeTab];
  const { url: imageUrl, loading: imageLoading } = useWikiImage(
    currentCeleb.celeb.wikiQuery
  );

  const totalScore = roundStates.reduce((sum, r) => sum + r.score, 0);
  const totalCompleted = roundStates.filter((r) => r.completed).length;

  useEffect(() => {
    startGame("faceless");
  }, []);

  // Check game over
  useEffect(() => {
    if (gameOver) return;

    // In gauntlet mode, any failed round = instant loss
    if (isSpecialMode) {
      const failedRound = roundStates.find((r) => r.completed && !r.won);
      if (failedRound) {
        setGameOver(true);
        completeGame("faceless", "loss", roundStates.reduce((sum, r) => sum + r.score, 0));
        return;
      }
      if (roundStates.every((r) => r.completed && r.won)) {
        const score = roundStates.reduce((sum, r) => sum + r.score, 0);
        setGameOver(true);
        completeGame("faceless", "win", score);
        return;
      }
      return;
    }

    if (roundStates.every((r) => r.completed)) {
      const score = roundStates.reduce((sum, r) => sum + r.score, 0);
      setGameOver(true);
      completeGame("faceless", score === MAX_SCORE ? "win" : "loss", score);
    }
  }, [roundStates, gameOver, completeGame, isSpecialMode]);

  /* ---- handlers ---- */
  const handleGuess = (name: string) => {
    if (gameOver || currentState.completed) return;

    const isCorrect =
      name.toLowerCase() === currentCeleb.celeb.name.toLowerCase();
    const newGuesses = [...currentState.guesses, name];
    const newAttemptIndex = currentState.attemptIndex + 1;

    setRoundStates((prev) => {
      const next = [...prev];
      if (isCorrect) {
        const score = POINTS_BY_ATTEMPT[currentState.attemptIndex];
        next[activeTab] = {
          ...next[activeTab],
          guesses: newGuesses,
          attemptIndex: newAttemptIndex,
          completed: true,
          won: true,
          score,
        };
      } else if (newAttemptIndex >= MAX_ATTEMPTS) {
        next[activeTab] = {
          ...next[activeTab],
          guesses: newGuesses,
          attemptIndex: newAttemptIndex,
          completed: true,
          won: false,
          score: 0,
        };
      } else {
        next[activeTab] = {
          ...next[activeTab],
          guesses: newGuesses,
          attemptIndex: newAttemptIndex,
        };
      }
      return next;
    });
  };

  const handleHint = () => {
    if (currentState.hintUsed || currentState.completed || gameOver) return;

    // Hint costs 1 guess but does NOT zoom out
    const newAttemptIndex = currentState.attemptIndex + 1;

    setRoundStates((prev) => {
      const next = [...prev];
      if (newAttemptIndex >= MAX_ATTEMPTS) {
        // Hint used up last attempt → fail
        next[activeTab] = {
          ...next[activeTab],
          hintUsed: true,
          attemptIndex: newAttemptIndex,
          completed: true,
          won: false,
          score: 0,
        };
      } else {
        // Only increment attemptIndex for scoring, NOT wrongGuesses for zoom
        next[activeTab] = {
          ...next[activeTab],
          hintUsed: true,
          attemptIndex: newAttemptIndex,
        };
      }
      return next;
    });
  };

  /* ---- share text ---- */
  const shareText = `\u{1F3AD} GAUNTLET \u2014 Faceless\nScore: ${totalScore}/${MAX_SCORE}\n${roundStates
    .map((r) => {
      if (!r.completed) return "\u2B1C";
      if (r.won)
        return r.score === 3
          ? "\u{1F7E9}"
          : r.score === 2
          ? "\u{1F7E8}"
          : "\u{1F7E7}";
      return "\u{1F7E5}";
    })
    .join("")}\n\nPlay at gauntlet.gg`;

  /* ================================================================ */
  if (alreadyPlayedLoading) {
    return <div className="pt-6 pb-4"><GameNav title="Faceless" /><div className="text-center py-12 text-muted">Loading...</div></div>;
  }

  if (completedState && !isSpecialMode) {
    return <div className="pt-6 pb-4"><GameNav title="Faceless" /><AlreadyPlayed gameTitle="Faceless" state={completedState} /></div>;
  }

  return (
    <div className="flex flex-col pt-4 pb-2 min-h-[calc(100dvh-5rem)]">
      {!isSpecialMode && <GameNav title="Faceless" />}
      {!isSpecialMode && <ConfettiExplosion trigger={gameOver && totalScore === MAX_SCORE} />}

      <p className="text-muted text-sm text-center mb-3">Identify the celebrity from a zoomed-in photo</p>

      {/* ---- Round tabs ---- */}
      <div className="flex gap-1 mb-3">
        {dailyCelebs.map((_, i) => {
          const state = roundStates[i];
          const isActive = i === activeTab && !gameOver;

          return (
            <button
              key={i}
              onClick={() => !gameOver && setActiveTab(i)}
              disabled={gameOver}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                isActive
                  ? "bg-primary/25 border border-accent/50 text-accent"
                  : state.completed
                  ? state.won
                    ? "bg-success/10 border border-success/30 text-success"
                    : "bg-error/10 border border-error/30 text-error"
                  : "bg-surface/30 border border-dim/15 text-muted hover:bg-surface/50"
              } ${gameOver ? "cursor-default" : "cursor-pointer"}`}
            >
              <span>Round {i + 1}</span>
              {state.completed &&
                (state.won ? (
                  <Check size={11} className="shrink-0" />
                ) : (
                  <XIcon size={11} className="shrink-0" />
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
            {!currentState.completed ? (
              <>
                {/* ---- Guess lives bar ---- */}
                <div className="flex items-center justify-center gap-3 mb-4 py-2 px-4 rounded-xl bg-surface/30 border border-dim/15">
                  <div className="flex gap-2">
                    {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => {
                      const used = i < currentState.attemptIndex;
                      const current = i === currentState.attemptIndex;
                      return (
                        <div
                          key={i}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            used
                              ? "bg-error/20 border border-error/40"
                              : current
                              ? "bg-accent/20 border border-accent/50 animate-pulse"
                              : "bg-dim/10 border border-dim/20"
                          }`}
                        >
                          {used ? (
                            <XIcon size={14} className="text-error/70" />
                          ) : (
                            <span
                              className={`text-xs font-bold ${
                                current ? "text-accent" : "text-dim/40"
                              }`}
                            >
                              {i + 1}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-5 w-px bg-dim/20" />
                  <span className="text-sm font-display font-bold text-accent">
                    {MAX_ATTEMPTS - currentState.attemptIndex}
                    <span className="text-muted font-normal text-xs ml-1">left</span>
                  </span>
                </div>

                {/* ---- Zoomed image (zoom based on wrong guesses only, not hints) ---- */}
                <FacelessImage
                  imageUrl={imageUrl}
                  loading={imageLoading}
                  zoomLevel={currentState.guesses.length}
                  focalPoint={currentCeleb.focalPoint}
                  revealed={false}
                />

                {/* ---- Category hint badge ---- */}
                {currentState.hintUsed && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-3"
                  >
                    <span className="inline-block px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-medium">
                      {currentCeleb.celeb.category}
                    </span>
                  </motion.div>
                )}

                {/* ---- Hint button + input ---- */}
                <div className="mt-3 space-y-3">
                  {!currentState.hintUsed && (
                    <button
                      onClick={handleHint}
                      className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/25 transition-all"
                    >
                      <Eye size={18} />
                      <span>Reveal Category</span>
                      <span className="text-[10px] text-accent/60 ml-1">(-1 guess)</span>
                    </button>
                  )}

                  <FacelessInput
                    celebNames={allCelebNames}
                    onGuess={handleGuess}
                    disabled={currentState.completed}
                    previousGuesses={currentState.guesses}
                  />
                </div>

                {/* ---- Previous wrong guesses ---- */}
                {currentState.guesses.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {currentState.guesses.map((guess, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-error/10 border border-error/20 text-sm"
                      >
                        <XIcon size={12} className="text-error shrink-0" />
                        <span className="text-error/70">{guess}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* ---- Round completed ---- */
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <FacelessImage
                  imageUrl={imageUrl}
                  loading={imageLoading}
                  zoomLevel={3}
                  focalPoint={currentCeleb.focalPoint}
                  revealed={true}
                />

                <h3
                  className={`font-display text-2xl font-bold ${
                    currentState.won ? "text-success" : "text-error"
                  }`}
                >
                  {currentState.won ? "Correct!" : "Missed!"}
                </h3>
                <p className="text-white font-medium text-lg">
                  {currentCeleb.celeb.name}
                </p>
                <p className="text-muted text-xs">
                  {currentCeleb.celeb.category}
                </p>
                {currentState.won && (
                  <p className="text-accent font-display font-bold">
                    +{currentState.score} points
                  </p>
                )}

                {totalCompleted < CELEBS_PER_DAY && (
                  <p className="text-muted text-xs mt-1">
                    Pick another round to continue
                  </p>
                )}
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
            {totalScore === MAX_SCORE ? (
              <span className="text-success">Perfect Score!</span>
            ) : (
              <span className="text-accent">
                {totalScore}/{MAX_SCORE}
              </span>
            )}
          </h3>
          <p className="text-muted text-sm">
            You scored {totalScore} out of {MAX_SCORE} points
          </p>

          <div className="space-y-1.5 text-left w-full">
            {dailyCelebs.map((dc, i) => {
              const state = roundStates[i];
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-sm ${
                    state.won
                      ? "bg-success/10 border border-success/30"
                      : "bg-error/10 border border-error/30"
                  }`}
                >
                  <span className={state.won ? "text-success" : "text-error"}>
                    {state.won ? "\u2713" : "\u2717"}
                  </span>
                  <span className="font-medium truncate flex-1">
                    {dc.celeb.name}
                  </span>
                  <span className="text-[10px] text-dim shrink-0 px-1.5 py-0.5 rounded-full bg-dim/10">
                    {state.won ? `+${state.score}` : "0"}
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
