"use client";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { useGauntletContext } from "@/context/GauntletContext";
import { saveGameResult, updateStreak, addXP } from "@/lib/db";
import { XP_REWARDS } from "@/types";
import type { GameId, GameResult } from "@/types";

export function useGame() {
  const store = useGameStore();
  const { user, isGuest } = useAuthStore();
  const gauntlet = useGauntletContext();

  const completeGame = async (gameId: GameId, result: GameResult, score?: number) => {
    store.setResult(result);

    if (user && !isGuest) {
      await saveGameResult(user.uid, gameId, {
        gameId,
        date: new Date().toISOString().split("T")[0],
        result,
        guesses: store.guesses,
        startedAt: store.startedAt || Date.now(),
        completedAt: Date.now(),
        score,
      });

      if (result === "win") {
        await addXP(user.uid, XP_REWARDS.WIN_DAILY);
      } else {
        await addXP(user.uid, XP_REWARDS.COMPLETE_DAILY);
      }

      await updateStreak(user.uid, gameId);
      await updateStreak(user.uid, "global");
    }

    // Notify gauntlet if we're in gauntlet mode
    if (gauntlet.isGauntlet) {
      gauntlet.onComplete(gameId, result, score);
    }
  };

  return { ...store, completeGame };
}
