"use client";
import type { DailyHistory, GameId } from "@/types";
import { useCountdown } from "@/hooks/useCountdown";

interface DailyStatusProps {
  history: DailyHistory | null;
}

const GAME_IDS: GameId[] = ["wordless", "songless", "sayless", "moreless", "clueless", "spellingbee", "faceless"];

export default function DailyStatus({ history }: DailyStatusProps) {
  const timeLeft = useCountdown();
  const completedCount = GAME_IDS.filter(
    (id) => history?.games?.[id]?.result === "win" || history?.games?.[id]?.result === "loss"
  ).length;

  return (
    <div className="flex items-center justify-between py-3 px-4 glass-card mt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">Today:</span>
        <span className="font-display font-bold text-accent">
          {completedCount}/{GAME_IDS.length}
        </span>
        <span className="text-sm text-muted">completed</span>
      </div>
      <div className="text-right">
        <span className="text-xs text-muted">Resets in </span>
        <span className="font-display text-sm font-bold text-primary-light">
          {timeLeft}
        </span>
      </div>
    </div>
  );
}
