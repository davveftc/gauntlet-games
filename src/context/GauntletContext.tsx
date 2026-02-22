"use client";
import { createContext, useContext } from "react";
import type { GameId, GameResult } from "@/types";

interface GauntletContextValue {
  isGauntlet: boolean;
  onComplete: (gameId: GameId, result: GameResult, score?: number) => void;
}

const GauntletContext = createContext<GauntletContextValue>({
  isGauntlet: false,
  onComplete: () => {},
});

export function GauntletProvider({
  children,
  onComplete,
}: {
  children: React.ReactNode;
  onComplete: (gameId: GameId, result: GameResult, score?: number) => void;
}) {
  return (
    <GauntletContext.Provider value={{ isGauntlet: true, onComplete }}>
      {children}
    </GauntletContext.Provider>
  );
}

export function useGauntletContext() {
  return useContext(GauntletContext);
}
