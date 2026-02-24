"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X as XIcon } from "lucide-react";
import SayLessPlayer from "@/components/games/sayless/SayLessPlayer";
import SayLessSuccess from "@/components/games/sayless/SayLessSuccess";
import SayLessSearch from "@/components/games/sayless/SayLessSearch";
import SayLessGuessRow from "@/components/games/sayless/SayLessGuessRow";
import SayLessBonusRound from "@/components/games/sayless/SayLessBonusRound";
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
import type { MovieQuote } from "@/types";
import MOVIES from "@/data/sayless-movies.json";

const MAX_GUESSES = 3;
const TOTAL_ROUNDS = 4;

type GuessEntry = { movie: string; year: number } | "skipped";

interface Round {
  category: string;
  movie: MovieQuote;
}

interface RoundState {
  guesses: GuessEntry[];
  completed: boolean;
  won: boolean;
}

// ---------- seeded RNG ----------
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

// ---------- fixed genre categories ----------
const GENRE_CATEGORIES = ["Action", "Comedy", "Thriller"] as const;

// ---------- daily round generation ----------
function getDailyRounds(movies: MovieQuote[], date: string): Round[] {
  const rng = createRng(hashDate(date));

  const genreMap = new Map<string, MovieQuote[]>();
  for (const movie of movies) {
    const list = genreMap.get(movie.genre) || [];
    list.push(movie);
    genreMap.set(movie.genre, list);
  }

  const usedIds = new Set<string>();

  const genrePicks: Round[] = GENRE_CATEGORIES.map((genre) => {
    const pool = [...(genreMap.get(genre) || [])].sort(() => rng() - 0.5);
    const pick = pool[0];
    usedIds.add(pick.id);
    return { category: genre, movie: pick };
  });

  // "Drama" pick for the "All" round
  const dramaPool = [...(genreMap.get("Drama") || [])].sort(() => rng() - 0.5);
  const dramaPick = dramaPool.find((m) => !usedIds.has(m.id)) || dramaPool[0];

  return [{ category: "All", movie: dramaPick }, ...genrePicks];
}

function createInitialRoundStates(): RoundState[] {
  return Array.from({ length: TOTAL_ROUNDS }, () => ({
    guesses: [],
    completed: false,
    won: false,
  }));
}

// ---------- component ----------
export default function SayLessPage() {
  const today = new Date().toISOString().split("T")[0];
  const rounds = useMemo(() => getDailyRounds(MOVIES as MovieQuote[], today), [today]);
  const { startGame, completeGame } = useGame();
  const { isGauntlet } = useGauntletContext();
  const { isChain } = useChainContext();
  const isSpecialMode = isGauntlet || isChain;
  const { completedState, loading: alreadyPlayedLoading } = useAlreadyPlayed("sayless");

  const [activeTab, setActiveTab] = useState(0);
  const [roundStates, setRoundStates] = useState<RoundState[]>(createInitialRoundStates);
  const [gameOver, setGameOver] = useState(false);
  const [pendingMovie, setPendingMovie] = useState<MovieQuote | null>(null);
  const [successRound, setSuccessRound] = useState<number | null>(null);
  const [bonusPhase, setBonusPhase] = useState(false);
  const [bonusScore, setBonusScore] = useState(0);

  // Poster URLs per round (fetched from Wikipedia)
  const [posterUrls, setPosterUrls] = useState<(string | null)[]>(
    () => new Array(TOTAL_ROUNDS).fill(null)
  );

  const currentRound = rounds[activeTab];
  const currentState = roundStates[activeTab];
  const totalCorrect = roundStates.filter((r) => r.won).length;
  const totalCompleted = roundStates.filter((r) => r.completed).length;

  useEffect(() => {
    startGame("sayless");
  }, []);

  // Fetch poster URLs in parallel on mount
  useEffect(() => {
    let cancelled = false;

    rounds.forEach((round, idx) => {
      const params = new URLSearchParams({
        title: round.movie.movie,
        year: String(round.movie.year),
      });
      fetch(`/api/movie-poster?${params}`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data.posterUrl) {
            setPosterUrls((prev) => {
              const next = [...prev];
              next[idx] = data.posterUrl;
              return next;
            });
          }
        })
        .catch(() => {
          // silently fail — poster is optional
        });
    });

    return () => {
      cancelled = true;
    };
  }, [rounds]);

  // Check for all rounds completed → enter bonus phase or end game
  useEffect(() => {
    if (gameOver || bonusPhase) return;

    // In gauntlet mode, any failed round = instant loss
    if (isSpecialMode) {
      const failedRound = roundStates.find((r) => r.completed && !r.won);
      if (failedRound) {
        setGameOver(true);
        completeGame("sayless", "loss", roundStates.filter((r) => r.won).length);
        return;
      }
      // All rounds won in gauntlet = win (skip bonus in gauntlet)
      if (roundStates.every((r) => r.completed && r.won)) {
        setGameOver(true);
        completeGame("sayless", "win", TOTAL_ROUNDS);
        return;
      }
      return;
    }

    // All rounds completed → enter bonus phase
    if (roundStates.every((r) => r.completed)) {
      setBonusPhase(true);
    }
  }, [roundStates, gameOver, bonusPhase, completeGame, isSpecialMode]);

  const advanceToNextIncomplete = (updatedStates: RoundState[]) => {
    const nextIdx = updatedStates.findIndex((r, i) => !r.completed && i !== activeTab);
    if (nextIdx !== -1) {
      setTimeout(() => {
        setActiveTab(nextIdx);
        setPendingMovie(null);
      }, 600);
    }
  };

  const handleSuccessContinue = () => {
    setSuccessRound(null);
    const nextIdx = roundStates.findIndex((r, i) => !r.completed && i !== activeTab);
    if (nextIdx !== -1) {
      setActiveTab(nextIdx);
      setPendingMovie(null);
    }
  };

  const handleGuess = (movie: MovieQuote) => {
    if (gameOver || currentState.completed) return;

    const isCorrect =
      movie.movie.toLowerCase() === currentRound.movie.movie.toLowerCase();

    const newGuesses: GuessEntry[] = [
      ...currentState.guesses,
      { movie: movie.movie, year: movie.year },
    ];

    const done = isCorrect || newGuesses.length >= MAX_GUESSES;

    setRoundStates((prev) => {
      const next = [...prev];
      next[activeTab] = { guesses: newGuesses, completed: done, won: isCorrect };
      if (done && isCorrect) {
        setSuccessRound(activeTab);
      } else if (done) {
        advanceToNextIncomplete(next);
      }
      return next;
    });
  };

  const handleSkip = () => {
    if (gameOver || currentState.completed) return;

    const newGuesses: GuessEntry[] = [...currentState.guesses, "skipped"];
    const done = newGuesses.length >= MAX_GUESSES;

    setRoundStates((prev) => {
      const next = [...prev];
      next[activeTab] = { guesses: newGuesses, completed: done, won: false };
      if (done) advanceToNextIncomplete(next);
      return next;
    });
  };

  const handleBonusComplete = (bonusCorrect: number) => {
    setBonusScore(bonusCorrect);
    setGameOver(true);
    const movieScore = totalCorrect;
    const totalScore = movieScore + bonusCorrect;
    completeGame("sayless", totalCorrect >= 3 ? "win" : "loss", totalScore);
  };

  const shareText = `\u{1F3AC} GAUNTLET \u2014 Say Less\nMovies: ${totalCorrect}/${TOTAL_ROUNDS} | Actors: ${bonusScore}/${TOTAL_ROUNDS}\n${roundStates
    .map((r) => (r.completed ? (r.won ? "\u2705" : "\u274C") : "\u2B1C"))
    .join("")}\n\nPlay at gauntlet.gg`;

  const tabLabels = useMemo(() => {
    return rounds.map((r) => r.category);
  }, [rounds]);

  // ---------- render ----------
  if (alreadyPlayedLoading) {
    return <div className="pt-6 pb-4"><GameNav title="Say Less" /><div className="text-center py-12 text-muted">Loading...</div></div>;
  }

  if (completedState && !isSpecialMode) {
    return <div className="pt-6 pb-4"><GameNav title="Say Less" /><AlreadyPlayed gameTitle="Say Less" state={completedState} /></div>;
  }

  return (
    <div className="flex flex-col pt-4 pb-2 min-h-[calc(100dvh-5rem)]">
      {!isSpecialMode && <GameNav title="Say Less" />}
      {!isSpecialMode && <ConfettiExplosion trigger={gameOver && totalCorrect === TOTAL_ROUNDS} />}

      <p className="text-muted text-sm text-center mb-3">Name the movie from a famous quote</p>

      {/* ---- Bonus phase ---- */}
      {bonusPhase && !gameOver && (
        <SayLessBonusRound
          rounds={rounds.map((r, i) => ({ movie: r.movie, won: roundStates[i].won }))}
          onComplete={handleBonusComplete}
        />
      )}

      {/* ---- Main game (hidden during bonus phase) ---- */}
      {!bonusPhase && !gameOver && (
        <>
          {/* ---- Category tabs ---- */}
          <div className="flex gap-1 mb-3">
            {rounds.map((_, i) => {
              const state = roundStates[i];
              const isActive = i === activeTab;

              return (
                <button
                  key={i}
                  onClick={() => { setActiveTab(i); setPendingMovie(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    isActive
                      ? "bg-primary/25 border border-accent/50 text-accent"
                      : state.completed
                      ? state.won
                        ? "bg-success/10 border border-success/30 text-success"
                        : "bg-error/10 border border-error/30 text-error"
                      : "bg-surface/30 border border-dim/15 text-muted hover:bg-surface/50"
                  } cursor-pointer`}
                >
                  <span className="truncate">{tabLabels[i]}</span>
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

          {/* ---- Success popup overlay ---- */}
          <AnimatePresence>
            {successRound !== null && (
              <SayLessSuccess
                movie={rounds[successRound].movie.movie}
                year={rounds[successRound].movie.year}
                genre={rounds[successRound].movie.genre}
                quote={rounds[successRound].movie.quote}
                posterUrl={posterUrls[successRound]}
                onContinue={handleSuccessContinue}
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col flex-1 min-h-0"
            >
              {/* ---- Guesses frame ---- */}
              <div className="mb-3">
                <div className="space-y-1">
                  {Array.from({ length: MAX_GUESSES }).map((_, i) => {
                    const guess = currentState.guesses[i];
                    if (guess) {
                      return (
                        <SayLessGuessRow
                          key={i}
                          guess={guess}
                          index={i}
                          isCorrect={
                            guess !== "skipped" &&
                            guess.movie.toLowerCase() ===
                              currentRound.movie.movie.toLowerCase()
                          }
                        />
                      );
                    }
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg border border-primary/30 bg-[rgba(26,16,64,0.7)]"
                      >
                        <span className="text-[10px] text-dim/40 w-4">{i + 1}</span>
                        <div className="flex-1 h-4" />
                      </div>
                    );
                  })}
                </div>

                {/* answer reveal inside frame */}
                {currentState.completed && (
                  <div
                    className={`mt-2 pt-2 border-t text-center text-sm ${
                      currentState.won ? "border-success/20" : "border-error/20"
                    }`}
                  >
                    <span className="font-bold">{currentRound.movie.movie}</span>
                    <span className="text-muted"> ({currentRound.movie.year})</span>
                  </div>
                )}
              </div>

              {/* ---- Player ---- */}
              <SayLessPlayer quote={currentRound.movie.quote} />

              {/* ---- Search + submit + skip ---- */}
              {!currentState.completed && (
                <div className="flex flex-col gap-2 mt-3">
                  <SayLessSearch
                    movies={MOVIES as MovieQuote[]}
                    onSelect={(movie) => setPendingMovie(movie)}
                    selectedMovie={pendingMovie}
                    onClear={() => setPendingMovie(null)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        if (pendingMovie) {
                          handleGuess(pendingMovie);
                          setPendingMovie(null);
                        }
                      }}
                      disabled={!pendingMovie}
                      className="flex-1"
                    >
                      Submit
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={handleSkip}
                      className="flex-1"
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              )}

              {/* completed prompt */}
              {currentState.completed && totalCompleted < TOTAL_ROUNDS && (
                <p className="text-center text-muted text-xs mt-4">
                  Pick another category to continue
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* ---- Game over summary ---- */}
      {gameOver && !isSpecialMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center gap-3"
        >
          <h3 className="font-display text-3xl font-bold">
            {totalCorrect === TOTAL_ROUNDS ? (
              <span className="text-success">Perfect!</span>
            ) : (
              <span className="text-accent">
                {totalCorrect}/{TOTAL_ROUNDS}
              </span>
            )}
          </h3>
          <p className="text-muted text-sm">
            You got {totalCorrect} out of {TOTAL_ROUNDS} movies
            {bonusScore > 0 && ` + ${bonusScore} bonus actor${bonusScore !== 1 ? "s" : ""}`}
          </p>

          <div className="space-y-1.5 text-left w-full">
            {rounds.map((round, i) => {
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
                    {round.movie.movie}
                    <span className="text-muted font-normal text-xs">
                      {" "} ({round.movie.year})
                    </span>
                  </span>
                  <span className="text-[10px] text-dim shrink-0 px-1.5 py-0.5 rounded-full bg-dim/10">
                    {round.category}
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
