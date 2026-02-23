"use client";
import { createContext, useContext } from "react";
import type { GameId, GameResult } from "@/types";

interface ChainContextValue {
  isChain: boolean;
  chainId: string | null;
  linkIndex: number;
  onComplete: (gameId: GameId, result: GameResult, score?: number) => void;
}

const ChainContext = createContext<ChainContextValue>({
  isChain: false,
  chainId: null,
  linkIndex: 0,
  onComplete: () => {},
});

export function ChainProvider({
  children,
  chainId,
  linkIndex,
  onComplete,
}: {
  children: React.ReactNode;
  chainId: string;
  linkIndex: number;
  onComplete: (gameId: GameId, result: GameResult, score?: number) => void;
}) {
  return (
    <ChainContext.Provider value={{ isChain: true, chainId, linkIndex, onComplete }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChainContext() {
  return useContext(ChainContext);
}
