"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X as XIcon } from "lucide-react";
import SonglessPlayer from "@/components/games/songless/SonglessPlayer";
import SonglessSuccess from "@/components/games/songless/SonglessSuccess";
import SongSearch from "@/components/games/songless/SongSearch";
import SongGuessRow from "@/components/games/songless/SongGuessRow";
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
import type { Song } from "@/types";
import SONGS from "@/data/songless-songs.json";

const MAX_GUESSES = 6;
const TOTAL_ROUNDS = 4;

type GuessEntry = { title: string; artist: string } | "skipped";

interface Round {
  category: string;
  song: Song;
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
const GENRE_CATEGORIES = ["Hip-Hop", "Pop", "Rock"] as const;

// ---------- daily round generation ----------
function getDailyRounds(songs: Song[], date: string): Round[] {
  const rng = createRng(hashDate(date));

  const genreMap = new Map<string, Song[]>();
  for (const song of songs) {
    const list = genreMap.get(song.genre) || [];
    list.push(song);
    genreMap.set(song.genre, list);
  }

  const usedIds = new Set<string>();

  const genrePicks: Round[] = GENRE_CATEGORIES.map((genre) => {
    const pool = [...(genreMap.get(genre) || [])].sort(() => rng() - 0.5);
    const pick = pool[0];
    usedIds.add(pick.id);
    return { category: genre, song: pick };
  });

  const allPool = [...songs].sort(() => rng() - 0.5);
  const allPick = allPool.find((s) => !usedIds.has(s.id))!;

  return [{ category: "All", song: allPick }, ...genrePicks];
}

function createInitialRoundStates(): RoundState[] {
  return Array.from({ length: TOTAL_ROUNDS }, () => ({
    guesses: [],
    completed: false,
    won: false,
  }));
}

// ---------- component ----------
export default function SonglessPage() {
  const today = new Date().toISOString().split("T")[0];
  const rounds = useMemo(() => getDailyRounds(SONGS as Song[], today), [today]);
  const { startGame, completeGame } = useGame();
  const { isGauntlet } = useGauntletContext();
  const { isChain } = useChainContext();
  const isSpecialMode = isGauntlet || isChain;
  const { completedState, loading: alreadyPlayedLoading } = useAlreadyPlayed("songless");

  const [activeTab, setActiveTab] = useState(0);
  const [roundStates, setRoundStates] = useState<RoundState[]>(createInitialRoundStates);
  const [gameOver, setGameOver] = useState(false);
  const [pendingSong, setPendingSong] = useState<Song | null>(null);
  const [successRound, setSuccessRound] = useState<number | null>(null);

  // Audio preview state per round
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>(
    () => new Array(TOTAL_ROUNDS).fill(null)
  );
  const [coverUrls, setCoverUrls] = useState<(string | null)[]>(
    () => new Array(TOTAL_ROUNDS).fill(null)
  );
  const [previewLoading, setPreviewLoading] = useState<boolean[]>(
    () => new Array(TOTAL_ROUNDS).fill(true)
  );
  const [previewErrors, setPreviewErrors] = useState<(string | null)[]>(
    () => new Array(TOTAL_ROUNDS).fill(null)
  );

  const currentRound = rounds[activeTab];
  const currentState = roundStates[activeTab];
  const totalCorrect = roundStates.filter((r) => r.won).length;
  const totalCompleted = roundStates.filter((r) => r.completed).length;

  useEffect(() => {
    startGame("songless");
  }, []);

  // Fetch all preview URLs in parallel on mount
  useEffect(() => {
    let cancelled = false;

    rounds.forEach((round, idx) => {
      const params = new URLSearchParams({
        title: round.song.title,
        artist: round.song.artist,
      });
      fetch(`/api/song-preview?${params}`)
        .then((res) => {
          if (!res.ok) throw new Error("No preview");
          return res.json();
        })
        .then((data) => {
          if (cancelled) return;
          setPreviewUrls((prev) => {
            const next = [...prev];
            next[idx] = data.previewUrl;
            return next;
          });
          if (data.coverUrl) {
            setCoverUrls((prev) => {
              const next = [...prev];
              next[idx] = data.coverUrl;
              return next;
            });
          }
        })
        .catch(() => {
          if (cancelled) return;
          setPreviewErrors((prev) => {
            const next = [...prev];
            next[idx] = "Could not load preview";
            return next;
          });
        })
        .finally(() => {
          if (cancelled) return;
          setPreviewLoading((prev) => {
            const next = [...prev];
            next[idx] = false;
            return next;
          });
        });
    });

    return () => {
      cancelled = true;
    };
  }, [rounds]);

  // Check for game over when all rounds complete
  useEffect(() => {
    if (gameOver) return;

    // In gauntlet mode, any failed round = instant loss
    if (isSpecialMode) {
      const failedRound = roundStates.find((r) => r.completed && !r.won);
      if (failedRound) {
        setGameOver(true);
        completeGame("songless", "loss", roundStates.filter((r) => r.won).length);
        return;
      }
      // All rounds won = gauntlet win
      if (roundStates.every((r) => r.completed && r.won)) {
        setGameOver(true);
        completeGame("songless", "win", TOTAL_ROUNDS);
        return;
      }
      return;
    }

    if (roundStates.every((r) => r.completed)) {
      const won = roundStates.filter((r) => r.won).length;
      setGameOver(true);
      completeGame("songless", won >= 3 ? "win" : "loss", won);
    }
  }, [roundStates, gameOver, completeGame, isSpecialMode]);

  const advanceToNextIncomplete = (updatedStates: RoundState[]) => {
    const nextIdx = updatedStates.findIndex((r, i) => !r.completed && i !== activeTab);
    if (nextIdx !== -1) {
      setTimeout(() => {
        setActiveTab(nextIdx);
        setPendingSong(null);
      }, 600);
    }
  };

  const handleSuccessContinue = () => {
    setSuccessRound(null);
    // Advance to next incomplete round
    const nextIdx = roundStates.findIndex((r, i) => !r.completed && i !== activeTab);
    if (nextIdx !== -1) {
      setActiveTab(nextIdx);
      setPendingSong(null);
    }
  };

  const handleGuess = (song: Song) => {
    if (gameOver || currentState.completed) return;

    const isCorrect =
      song.title.toLowerCase() === currentRound.song.title.toLowerCase() &&
      song.artist.toLowerCase() === currentRound.song.artist.toLowerCase();

    const newGuesses: GuessEntry[] = [
      ...currentState.guesses,
      { title: song.title, artist: song.artist },
    ];

    const done = isCorrect || newGuesses.length >= MAX_GUESSES;

    setRoundStates((prev) => {
      const next = [...prev];
      next[activeTab] = { guesses: newGuesses, completed: done, won: isCorrect };
      if (done && isCorrect) {
        // Show success popup — user will click Continue to advance
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

  const shareText = `\u{1F3B5} GAUNTLET \u2014 Songless\nScore: ${totalCorrect}/${TOTAL_ROUNDS}\n${roundStates
    .map((r) => (r.completed ? (r.won ? "\u2705" : "\u274C") : "\u2B1C"))
    .join("")}\n\nPlay at gauntlet.gg`;

  const tabLabels = useMemo(() => {
    let allCount = 0;
    const allTotal = rounds.filter((r) => r.category === "All").length;
    return rounds.map((r) => {
      if (r.category === "All") {
        allCount++;
        return allTotal > 1 ? `All ${allCount}` : "All";
      }
      return r.category;
    });
  }, [rounds]);

  // ---------- render ----------
  if (alreadyPlayedLoading) {
    return <div className="pt-6 pb-4"><GameNav title="Songless" /><div className="text-center py-12 text-muted">Loading...</div></div>;
  }

  if (completedState && !isSpecialMode) {
    return <div className="pt-6 pb-4"><GameNav title="Songless" /><AlreadyPlayed gameTitle="Songless" state={completedState} /></div>;
  }

  return (
    <div className="flex flex-col pt-4 pb-2 min-h-[calc(100dvh-5rem)]">
      {!isSpecialMode && <GameNav title="Songless" />}
      {!isSpecialMode && <ConfettiExplosion trigger={gameOver && totalCorrect === TOTAL_ROUNDS} />}

      <p className="text-muted text-sm text-center mb-3">Listen to a short clip and name the song</p>

      {/* ---- Category tabs ---- */}
      <div className="flex gap-1 mb-3">
        {rounds.map((_, i) => {
          const state = roundStates[i];
          const isActive = i === activeTab && !gameOver;

          return (
            <button
              key={i}
              onClick={() => { if (!gameOver) { setActiveTab(i); setPendingSong(null); } }}
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
        {!gameOver && successRound !== null && (
          <SonglessSuccess
            title={rounds[successRound].song.title}
            artist={rounds[successRound].song.artist}
            coverUrl={coverUrls[successRound]}
            previewUrl={previewUrls[successRound]}
            onContinue={handleSuccessContinue}
          />
        )}
      </AnimatePresence>

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
            {/* ---- Guesses frame ---- */}
            <div className="mb-3">
              <div className="space-y-1">
                {Array.from({ length: MAX_GUESSES }).map((_, i) => {
                  const guess = currentState.guesses[i];
                  if (guess) {
                    return (
                      <SongGuessRow
                        key={i}
                        guess={guess}
                        index={i}
                        isCorrect={
                          guess !== "skipped" &&
                          guess.title.toLowerCase() ===
                            currentRound.song.title.toLowerCase()
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
                  <span className="font-bold">{currentRound.song.title}</span>
                  <span className="text-muted"> — {currentRound.song.artist}</span>
                </div>
              )}
            </div>

            {/* ---- Player ---- */}
            <SonglessPlayer
              previewUrl={previewUrls[activeTab]}
              isLoading={previewLoading[activeTab]}
              error={previewErrors[activeTab]}
              guessNumber={currentState.guesses.length}
              maxDuration={5}
            />

            {/* ---- Search + submit + skip ---- */}
            {!currentState.completed && (
              <div className="flex flex-col gap-2 mt-3">
                <SongSearch
                  songs={SONGS as Song[]}
                  onSelect={(song) => setPendingSong(song)}
                  selectedSong={pendingSong}
                  onClear={() => setPendingSong(null)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      if (pendingSong) {
                        handleGuess(pendingSong);
                        setPendingSong(null);
                      }
                    }}
                    disabled={!pendingSong}
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
            You got {totalCorrect} out of {TOTAL_ROUNDS} songs
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
                    {round.song.title}
                    <span className="text-muted font-normal text-xs">
                      {" "} — {round.song.artist}
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
