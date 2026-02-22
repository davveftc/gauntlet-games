"use client";
import { motion } from "framer-motion";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
}

export default function LeaderboardRow({ entry, index }: LeaderboardRowProps) {
  const rankColors: Record<number, string> = {
    1: "text-accent neon-text-gold",
    2: "text-gray-300",
    3: "text-orange-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 py-3 px-4 bg-surface/30 rounded-xl border border-primary/10"
    >
      <span className={`font-display font-bold text-lg w-8 ${rankColors[entry.rank] || "text-muted"}`}>
        {entry.rank}
      </span>
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
        {entry.avatar === "default" ? "\u{1F464}" : "\u{1F31F}"}
      </div>
      <span className="flex-1 font-medium text-sm truncate">{entry.displayName}</span>
      <span className="font-display font-bold text-accent">{entry.score.toLocaleString()}</span>
    </motion.div>
  );
}
