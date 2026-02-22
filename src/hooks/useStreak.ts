"use client";
import { useProfileStore } from "@/stores/profileStore";
import type { GameId } from "@/types";

export function useStreak(gameId?: GameId) {
  const { streaks } = useProfileStore();

  if (!streaks) return { current: 0, longest: 0 };

  if (gameId) {
    return {
      current: streaks[gameId]?.current || 0,
      longest: streaks[gameId]?.longest || 0,
    };
  }

  return {
    current: streaks.global?.current || 0,
    longest: streaks.global?.longest || 0,
  };
}
