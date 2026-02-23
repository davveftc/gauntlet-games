"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useGauntletContext } from "@/context/GauntletContext";
import { useChainContext } from "@/context/ChainContext";
import { getDailyHistory } from "@/lib/db";
import type { GameId, GameState } from "@/types";

export function useAlreadyPlayed(gameId: GameId) {
  const { user, isGuest } = useAuthStore();
  const { isGauntlet } = useGauntletContext();
  const { isChain } = useChainContext();
  const [completedState, setCompletedState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip check in gauntlet/chain mode — always allow play
    if (isGauntlet || isChain) {
      setLoading(false);
      return;
    }

    if (!user || isGuest) {
      setLoading(false);
      return;
    }

    getDailyHistory(user.uid)
      .then((history) => {
        const game = history?.games?.[gameId];
        if (game && (game.result === "win" || game.result === "loss")) {
          setCompletedState(game);
        }
      })
      .finally(() => setLoading(false));
  }, [user, isGuest, gameId, isGauntlet, isChain]);

  return { completedState, loading };
}
