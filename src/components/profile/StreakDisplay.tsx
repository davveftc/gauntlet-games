"use client";
import type { UserStreaks, GameId } from "@/types";

interface StreakDisplayProps {
  streaks: UserStreaks | null;
}

const GAME_IDS: GameId[] = ["wordless", "songless", "sayless", "moreless", "clueless", "spellingbee", "faceless"];
const GAME_NAMES: Record<GameId, string> = {
  wordless: "Wordless",
  songless: "Songless",
  sayless: "Say Less",
  moreless: "More/Less",
  clueless: "Clueless",
  spellingbee: "Spelling Bee",
  faceless: "Faceless",
};

export default function StreakDisplay({ streaks }: StreakDisplayProps) {
  if (!streaks) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-display font-bold text-lg mb-3">Streaks</h3>
      {GAME_IDS.map((id) => {
        const streak = streaks[id];
        return (
          <div key={id} className="flex items-center justify-between py-2 px-3 bg-surface/30 rounded-lg">
            <span className="text-sm">{GAME_NAMES[id]}</span>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={`font-display font-bold ${streak.current > 0 ? "text-accent animate-fire" : "text-dim"}`}>
                  {streak.current}
                </span>
                <span className="text-xs text-muted ml-1">current</span>
              </div>
              <div className="text-right">
                <span className="font-display font-bold text-primary-light">{streak.longest}</span>
                <span className="text-xs text-muted ml-1">best</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
