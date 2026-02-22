"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { GameId, GameResult } from "@/types";

interface GameCardProps {
  gameId: GameId;
  title: string;
  description: string;
  emoji: string;
  status: GameResult;
  streak: number;
}

const statusBadge: Record<GameResult, { text: string; color: string }> = {
  win: { text: "Done", color: "text-success" },
  loss: { text: "Done", color: "text-error" },
  "in-progress": { text: "In Progress", color: "text-accent" },
  "not-started": { text: "Play Now", color: "text-primary-light" },
};

export default function GameCard({
  gameId,
  title,
  description,
  emoji,
  status,
  streak,
}: GameCardProps) {
  const badge = statusBadge[status];

  return (
    <Link href={`/play/${gameId}`}>
      <motion.div
        className="glass-card p-5 cursor-pointer group relative overflow-hidden"
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">{emoji}</span>
            {streak > 0 && (
              <span className="flex items-center gap-1 text-accent text-sm font-bold animate-fire">
                {streak}
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-bold mb-1">{title}</h3>
          <p className="text-muted text-sm mb-3">{description}</p>
          <span className={`text-sm font-medium ${badge.color}`}>
            {badge.text}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
