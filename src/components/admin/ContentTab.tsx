"use client";
import { useState, useMemo } from "react";
import WORDLESS_WORDS from "@/data/wordless-words.json";
import CLUELESS_DATA from "@/data/clueless-words.json";
import MORELESS_PAIRS from "@/data/moreless-pairs.json";
import SONGLESS_SONGS from "@/data/songless-songs.json";
import SAYLESS_MOVIES from "@/data/sayless-movies.json";
import SPELLINGBEE_WORDS from "@/data/spellingbee-words.json";

function hashDate(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) - hash) + date.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface ContentSection {
  game: string;
  emoji: string;
  content: string;
}

function getDailyContent(date: string): ContentSection[] {
  const hash = hashDate(date);
  const sections: ContentSection[] = [];

  // Wordless
  const wordlessWord = WORDLESS_WORDS[hash % WORDLESS_WORDS.length]?.toUpperCase() ?? "N/A";
  sections.push({ game: "Wordless", emoji: "\u{1F524}", content: `Target word: ${wordlessWord}` });

  // Clueless
  const cluelessEntry = (CLUELESS_DATA as { word: string }[])[hash % CLUELESS_DATA.length];
  sections.push({ game: "Clueless", emoji: "\u{1F50D}", content: `Target word: ${cluelessEntry?.word ?? "N/A"}` });

  // More/Less
  const pairIndex = hash % (MORELESS_PAIRS as unknown[]).length;
  sections.push({ game: "More/Less", emoji: "\u{1F4CA}", content: `Pair set index: ${pairIndex}` });

  // Songless
  const songIndex = hash % (SONGLESS_SONGS as unknown[]).length;
  const song = (SONGLESS_SONGS as { title?: string; artist?: string }[])[songIndex];
  sections.push({ game: "Songless", emoji: "\u{1F3B5}", content: song ? `${song.title} by ${song.artist}` : `Song index: ${songIndex}` });

  // Say Less
  const movieIndex = hash % (SAYLESS_MOVIES as unknown[]).length;
  const movie = (SAYLESS_MOVIES as { title?: string }[])[movieIndex];
  sections.push({ game: "Say Less", emoji: "\u{1F3AC}", content: movie ? `Movie: ${movie.title}` : `Movie index: ${movieIndex}` });

  // Spelling Bee
  const spellIndex = hash % (SPELLINGBEE_WORDS as unknown[]).length;
  sections.push({ game: "Spelling Bee", emoji: "\u{1F41D}", content: `Word set index: ${spellIndex}` });

  return sections;
}

export default function ContentTab() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const content = useMemo(() => getDailyContent(date), [date]);

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

      <div className="space-y-3">
        {content.map((section) => (
          <div key={section.game} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{section.emoji}</span>
              <span className="font-display font-bold text-sm">{section.game}</span>
            </div>
            <p className="text-sm text-muted">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
