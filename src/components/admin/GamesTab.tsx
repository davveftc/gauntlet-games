"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { GameAnalytics } from "@/lib/admin-db";

const GAME_NAMES: Record<string, { label: string; emoji: string }> = {
  songless: { label: "Songless", emoji: "\u{1F3B5}" },
  sayless: { label: "Say Less", emoji: "\u{1F3AC}" },
  moreless: { label: "More/Less", emoji: "\u{1F4CA}" },
  clueless: { label: "Clueless", emoji: "\u{1F50D}" },
  spellingbee: { label: "Spelling Bee", emoji: "\u{1F41D}" },
  faceless: { label: "Faceless", emoji: "\u{1F3AD}" },
};

export default function GamesTab() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [analytics, setAnalytics] = useState<GameAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/games?date=${date}`)
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm text-muted mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-2 text-white text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : analytics.length === 0 ? (
        <p className="text-center text-muted py-8">No games played on this date</p>
      ) : (
        <div className="space-y-3">
          {analytics.map((game, i) => {
            const info = GAME_NAMES[game.gameId] || { label: game.gameId, emoji: "\u{1F3AE}" };
            const winRate = game.plays > 0 ? Math.round((game.wins / game.plays) * 100) : 0;

            return (
              <motion.div
                key={game.gameId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{info.emoji}</span>
                    <span className="font-display font-bold text-sm">{info.label}</span>
                  </div>
                  <span className="text-accent font-bold text-sm">{game.plays} plays</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted mb-2">
                  <span className="text-success">{game.wins} wins</span>
                  <span className="text-error">{game.losses} losses</span>
                  <span>{game.plays - game.wins - game.losses} other</span>
                </div>

                <div className="w-full h-2 bg-surface/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${winRate}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                  />
                </div>
                <p className="text-xs text-muted mt-1">{winRate}% win rate</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
