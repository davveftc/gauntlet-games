"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import GauntletProgress from "@/components/gauntlet/GauntletProgress";
import GauntletRunner from "@/components/gauntlet/GauntletRunner";
import GauntletResult from "@/components/gauntlet/GauntletResult";
import AuthGuard from "@/components/auth/AuthGuard";
import GameNav from "@/components/layout/GameNav";
import Button from "@/components/shared/Button";
import CountdownTimer from "@/components/shared/CountdownTimer";
import { useAuthStore } from "@/stores/authStore";
import { saveGauntletResult, getGauntletResultToday, addXP, updateStreak } from "@/lib/db";
import { XP_REWARDS } from "@/types";
import type { GameId } from "@/types";

/* ------------------------------------------------------------------ */
/*  All available games                                                */
/* ------------------------------------------------------------------ */
const ALL_GAMES: { id: GameId; name: string; emoji: string }[] = [
  { id: "songless", name: "Songless", emoji: "🎵" },
  { id: "sayless", name: "Say Less", emoji: "🎬" },
  { id: "moreless", name: "More/Less", emoji: "📊" },
  { id: "clueless", name: "Clueless", emoji: "🔍" },
  { id: "spellingbee", name: "Spelling Bee", emoji: "🐝" },
  { id: "faceless", name: "Faceless", emoji: "🎭" },
];

const MIN_GAMES = 3;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function GauntletPage() {
  const { user, isGuest } = useAuthStore();

  /* ---- already-played lockout ---- */
  const [alreadyPlayed, setAlreadyPlayed] = useState<{
    result: "win" | "loss";
    score: number;
    gamesCompleted: string[];
  } | null>(null);
  const [lockoutLoading, setLockoutLoading] = useState(true);

  useEffect(() => {
    if (!user || isGuest) {
      setLockoutLoading(false);
      return;
    }
    getGauntletResultToday(user.uid)
      .then((res) => {
        if (res) setAlreadyPlayed(res);
      })
      .finally(() => setLockoutLoading(false));
  }, [user, isGuest]);

  /* ---- selection state ---- */
  const [selectedGames, setSelectedGames] = useState<Set<GameId>>(new Set());
  const [started, setStarted] = useState(false);

  /* ---- gameplay state ---- */
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [results, setResults] = useState<Record<string, "win" | "loss">>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [eliminated, setEliminated] = useState(false);
  const [completed, setCompleted] = useState(false);

  /* ---- derived ---- */
  const gameOrder = useMemo(
    () => ALL_GAMES.filter((g) => selectedGames.has(g.id)).map((g) => g.id),
    [selectedGames]
  );
  const multiplier = gameOrder.length;
  const canStart = selectedGames.size >= MIN_GAMES;

  /* ---- handlers ---- */
  const toggleGame = (id: GameId) => {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveGauntlet = useCallback(
    async (survived: boolean, finalScores: Record<string, number>, order: GameId[], finalResults: Record<string, "win" | "loss">) => {
      if (!user || isGuest) return;
      const rawTotal = Object.values(finalScores).reduce((sum, s) => sum + s, 0);
      const total = survived ? rawTotal * order.length : 0;
      const gamesCompleted = order.filter((g) => finalResults[g] === "win");

      await saveGauntletResult(user.uid, survived ? "win" : "loss", total, gamesCompleted);

      if (survived) {
        await addXP(user.uid, XP_REWARDS.SURVIVE_GAUNTLET);
      } else {
        await addXP(user.uid, XP_REWARDS.COMPLETE_GAUNTLET);
      }
      await updateStreak(user.uid, "gauntlet");
    },
    [user, isGuest]
  );

  const handleGameComplete = (
    gameId: GameId,
    result: "win" | "loss",
    score?: number
  ) => {
    const newResults = { ...results, [gameId]: result };
    const newScores = { ...scores, [gameId]: score ?? 0 };
    setResults(newResults);
    setScores(newScores);

    if (result === "loss") {
      setEliminated(true);
      setCompleted(true);
      saveGauntlet(false, newScores, gameOrder, newResults);
    } else if (currentGameIndex >= gameOrder.length - 1) {
      setCompleted(true);
      saveGauntlet(true, newScores, gameOrder, newResults);
    } else {
      setCurrentGameIndex((i) => i + 1);
    }
  };

  /* ---- calculate total points ---- */
  const rawTotal = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const totalPoints = eliminated ? 0 : rawTotal * multiplier;

  /* ================================================================ */
  if (lockoutLoading) {
    return (
      <AuthGuard requireAuth>
        <GameNav />
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-pulse text-primary-light font-display text-xl">Loading...</div>
        </div>
      </AuthGuard>
    );
  }

  if (alreadyPlayed) {
    const survived = alreadyPlayed.result === "win";
    return (
      <AuthGuard requireAuth>
        <GameNav />
        <div className="pt-6 flex flex-col items-center justify-center min-h-[80vh] text-center">
          <h1 className="font-display text-4xl font-bold neon-text-pink mb-6">
            THE GAUNTLET
          </h1>
          <div className="glass-card p-6 w-full max-w-sm space-y-4">
            <h3 className="font-display text-2xl font-bold">
              {survived ? (
                <span className="text-success">You survived today!</span>
              ) : (
                <span className="text-error">Eliminated today</span>
              )}
            </h3>
            {alreadyPlayed.score > 0 && (
              <p className="text-muted text-sm">
                Score: <span className="text-accent font-bold">{alreadyPlayed.score}</span>
              </p>
            )}
            <p className="text-muted text-sm">
              Come back tomorrow for another run.
            </p>
            <div className="pt-2 border-t border-dim/15">
              <CountdownTimer />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth>
      <GameNav />

      {/* ---- Game selection screen ---- */}
      {!started && (
        <div className="pt-6 flex flex-col items-center justify-center min-h-[80vh] text-center">
          <h1 className="font-display text-4xl font-bold neon-text-pink mb-2">
            THE GAUNTLET
          </h1>
          <p className="text-muted max-w-xs mb-1">
            Choose your games. Win them all for a score multiplier.
          </p>
          <p className="text-muted text-xs mb-6">
            Select at least {MIN_GAMES} games to begin.
          </p>

          {/* ---- Game cards ---- */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
            {ALL_GAMES.map((game) => {
              const selected = selectedGames.has(game.id);
              return (
                <motion.button
                  key={game.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleGame(game.id)}
                  className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border-2 transition-all ${
                    selected
                      ? "bg-accent/15 border-accent/60 shadow-[0_0_12px_rgba(var(--accent-rgb,200,170,255),0.25)]"
                      : "bg-surface/30 border-dim/20 opacity-50 hover:opacity-75"
                  }`}
                >
                  <span className="text-3xl">{game.emoji}</span>
                  <span
                    className={`text-sm font-display font-bold ${
                      selected ? "text-accent" : "text-dim"
                    }`}
                  >
                    {game.name}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* ---- Multiplier indicator ---- */}
          {selectedGames.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-accent/15 border border-accent/30 font-display font-bold text-accent text-lg">
                {selectedGames.size}× Multiplier
              </span>
              {selectedGames.size < MIN_GAMES && (
                <p className="text-error/70 text-xs mt-2">
                  Select at least {MIN_GAMES - selectedGames.size} more
                </p>
              )}
            </motion.div>
          )}

          <Button
            variant="secondary"
            size="lg"
            glow
            onClick={() => setStarted(true)}
            disabled={!canStart}
          >
            Begin Gauntlet
          </Button>
        </div>
      )}

      {/* ---- Gameplay ---- */}
      {started && !completed && (
        <div>
          <GauntletProgress
            gameOrder={gameOrder}
            currentIndex={currentGameIndex}
            results={results}
          />
          <GauntletRunner
            gameId={gameOrder[currentGameIndex]}
            gameIndex={currentGameIndex}
            totalGames={gameOrder.length}
            onComplete={handleGameComplete}
          />
        </div>
      )}

      {/* ---- Result ---- */}
      {started && completed && (
        <GauntletResult
          results={results}
          survived={!eliminated}
          gameOrder={gameOrder}
          multiplier={multiplier}
          totalPoints={totalPoints}
        />
      )}
    </AuthGuard>
  );
}
