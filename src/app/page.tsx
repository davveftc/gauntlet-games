"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getDailyHistory } from "@/lib/db";
import GameGrid from "@/components/home/GameGrid";
import GauntletBanner from "@/components/home/GauntletBanner";
import ChainBanner from "@/components/home/ChainBanner";
import DailyStatus from "@/components/home/DailyStatus";
import TopBar from "@/components/layout/TopBar";
import type { DailyHistory, GameId } from "@/types";

const GAMES: { gameId: GameId; title: string; description: string; emoji: string }[] = [
  {
    gameId: "songless",
    title: "Songless",
    description: "Name the song from a 0.1s clip",
    emoji: "\u{1F3B5}",
  },
  {
    gameId: "sayless",
    title: "Say Less",
    description: "Name the movie from a famous quote",
    emoji: "\u{1F3AC}",
  },
  {
    gameId: "moreless",
    title: "More/Less",
    description: "Which is higher? Don't overthink it",
    emoji: "\u{1F4CA}",
  },
  {
    gameId: "clueless",
    title: "Clueless",
    description: "Find the secret word by similarity",
    emoji: "\u{1F50D}",
  },
  {
    gameId: "spellingbee",
    title: "Spelling Bee",
    description: "Spell 5 words, each harder than the last",
    emoji: "\u{1F41D}",
  },
  {
    gameId: "faceless",
    title: "Faceless",
    description: "Identify the celebrity from a zoomed crop",
    emoji: "\u{1F3AD}",
  },
];

export default function HomePage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<DailyHistory | null>(null);

  useEffect(() => {
    if (user) {
      getDailyHistory(user.uid).then(setHistory).catch(() => setHistory(null));
    }
  }, [user]);

  return (
    <div className="pt-6">
      <TopBar />
      <div className="grid grid-cols-2 gap-3">
        <GauntletBanner />
        <ChainBanner />
      </div>
      <DailyStatus history={history} />
      <GameGrid games={GAMES} history={history} />
    </div>
  );
}
