"use client";
import GameCard from "./GameCard";
import type { GameId, DailyHistory, GameResult } from "@/types";

interface GameInfo {
  gameId: GameId;
  title: string;
  description: string;
  emoji: string;
}

interface GameGridProps {
  games: GameInfo[];
  history: DailyHistory | null;
}

export default function GameGrid({ games, history }: GameGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {games.map((game) => {
        const gameState = history?.games?.[game.gameId];
        const status: GameResult = gameState?.result || "not-started";

        return (
          <GameCard
            key={game.gameId}
            gameId={game.gameId}
            title={game.title}
            description={game.description}
            emoji={game.emoji}
            status={status}
            streak={0}
          />
        );
      })}
    </div>
  );
}
