"use client";
import LeaderboardRow from "./LeaderboardRow";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

export default function LeaderboardTable({ entries, loading }: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface/20 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">No leaderboard data yet</p>
        <p className="text-dim text-sm mt-1">Play games to appear on the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <LeaderboardRow key={entry.uid} entry={entry} index={i} />
      ))}
    </div>
  );
}
