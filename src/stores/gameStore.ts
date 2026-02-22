import { create } from "zustand";
import type { GameId, GameResult } from "@/types";

interface GameStoreState {
  activeGame: GameId | null;
  guesses: string[];
  result: GameResult;
  startedAt: number | null;
  completedAt: number | null;

  startGame: (gameId: GameId) => void;
  addGuess: (guess: string) => void;
  setResult: (result: GameResult) => void;
  reset: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  activeGame: null,
  guesses: [],
  result: "not-started",
  startedAt: null,
  completedAt: null,

  startGame: (gameId) =>
    set({
      activeGame: gameId,
      guesses: [],
      result: "in-progress",
      startedAt: Date.now(),
      completedAt: null,
    }),
  addGuess: (guess) =>
    set((state) => ({ guesses: [...state.guesses, guess] })),
  setResult: (result) => set({ result, completedAt: Date.now() }),
  reset: () =>
    set({
      activeGame: null,
      guesses: [],
      result: "not-started",
      startedAt: null,
      completedAt: null,
    }),
}));
