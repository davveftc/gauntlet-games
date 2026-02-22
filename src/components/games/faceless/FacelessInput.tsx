"use client";
import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

interface FacelessInputProps {
  celebNames: string[];
  onGuess: (name: string) => void;
  disabled: boolean;
  previousGuesses: string[];
}

export default function FacelessInput({
  celebNames,
  onGuess,
  disabled,
  previousGuesses,
}: FacelessInputProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const guessedSet = new Set(previousGuesses.map((g) => g.toLowerCase()));

  const filtered =
    query.length >= 2
      ? celebNames
          .filter(
            (name) =>
              name.toLowerCase().includes(query.toLowerCase()) &&
              !guessedSet.has(name.toLowerCase())
          )
          .slice(0, 8)
      : [];

  useEffect(() => {
    const handleClickOutside = () => setShowResults(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSelect = (name: string) => {
    onGuess(name);
    setQuery("");
    setShowResults(false);
  };

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
          placeholder="Type a celebrity name..."
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
          {filtered.map((name) => (
            <button
              key={name}
              onClick={() => handleSelect(name)}
              className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors border-b border-primary/10 last:border-0"
            >
              <p className="font-medium text-sm">{name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
