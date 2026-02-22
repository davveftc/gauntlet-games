"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import LeaderboardTabs from "@/components/leaderboard/LeaderboardTabs";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/types";

// Placeholder data for demo
const SAMPLE_ENTRIES: LeaderboardEntry[] = [
  { uid: "1", displayName: "GameMaster99", avatar: "default", score: 4850, rank: 1 },
  { uid: "2", displayName: "WordWizard", avatar: "default", score: 4200, rank: 2 },
  { uid: "3", displayName: "PuzzleQueen", avatar: "default", score: 3950, rank: 3 },
  { uid: "4", displayName: "BrainStorm", avatar: "default", score: 3600, rank: 4 },
  { uid: "5", displayName: "QuizKing", avatar: "default", score: 3100, rank: 5 },
  { uid: "6", displayName: "TriviaHero", avatar: "default", score: 2800, rank: 6 },
  { uid: "7", displayName: "LetterLord", avatar: "default", score: 2500, rank: 7 },
  { uid: "8", displayName: "NoteNinja", avatar: "default", score: 2200, rank: 8 },
  { uid: "9", displayName: "SpellMaster", avatar: "default", score: 1900, rank: 9 },
  { uid: "10", displayName: "ClueChaser", avatar: "default", score: 1600, rank: 10 },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("daily");
  const [entries, setEntries] = useState<LeaderboardEntry[]>(SAMPLE_ENTRIES);
  const [loading, setLoading] = useState(false);

  return (
    <div className="pt-6 pb-4">
      <TopBar />

      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold mb-1">Leaderboard</h2>
        <p className="text-muted text-sm">See who&apos;s on top</p>
      </div>

      <LeaderboardTabs active={period} onChange={setPeriod} />
      <LeaderboardTable entries={entries} loading={loading} />
    </div>
  );
}
