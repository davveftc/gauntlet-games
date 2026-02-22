"use client";
import WordlessTile from "./WordlessTile";
import type { WordlessTileData } from "@/types";

interface WordlessBoardProps {
  board: WordlessTileData[][];
  currentRow: number;
  shake: boolean;
}

export default function WordlessBoard({ board, currentRow, shake }: WordlessBoardProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 mb-6">
      {board.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex gap-1.5 ${rowIndex === currentRow && shake ? "animate-shake" : ""}`}
        >
          {row.map((tile, colIndex) => (
            <WordlessTile
              key={colIndex}
              letter={tile.letter}
              state={tile.state}
              delay={rowIndex < currentRow ? colIndex : 0}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
