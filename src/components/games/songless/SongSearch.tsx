"use client";
import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import type { Song } from "@/types";

interface SongSearchProps {
  songs: Song[];
  onSelect: (song: Song) => void;
  selectedSong?: Song | null;
  onClear?: () => void;
  disabled?: boolean;
}

export default function SongSearch({ songs, onSelect, selectedSong, onClear, disabled }: SongSearchProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.length >= 2
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.artist.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = () => setShowResults(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // If a song is selected, show it instead of the search input
  if (selectedSong) {
    return (
      <div className="flex items-center gap-2 bg-deep/50 border border-accent/40 rounded-xl px-4 py-3">
        <Search size={18} className="text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-white truncate">{selectedSong.title}</p>
          <p className="text-muted text-xs truncate">{selectedSong.artist}</p>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="shrink-0 p-1 rounded-lg hover:bg-primary/20 transition-colors"
          >
            <X size={16} className="text-muted" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for a song or artist..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          disabled={disabled}
          className="w-full bg-deep/50 border border-primary/30 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary disabled:opacity-50"
        />
      </div>

      {showResults && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-primary/30 rounded-xl overflow-hidden z-20 max-h-60 overflow-y-auto">
          {filtered.map((song) => (
            <button
              key={song.id}
              onClick={() => {
                onSelect(song);
                setQuery("");
                setShowResults(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors border-b border-primary/10 last:border-0"
            >
              <p className="font-medium text-sm">{song.title}</p>
              <p className="text-muted text-xs">{song.artist}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
