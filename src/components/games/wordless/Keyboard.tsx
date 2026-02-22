"use client";
import { motion } from "framer-motion";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TileState } from "@/types";

interface KeyboardProps {
  onKey: (key: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  letterStates: Record<string, TileState>;
}

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DEL"],
];

const stateColors: Record<string, string> = {
  correct: "bg-success/80 border-success text-white",
  present: "bg-accent/80 border-accent text-deep",
  absent: "bg-dim/40 border-dim/50 text-dim",
  default: "bg-surface border-primary/30 text-white hover:bg-primary/20",
};

export default function Keyboard({ onKey, onEnter, onDelete, letterStates }: KeyboardProps) {
  const handleClick = (key: string) => {
    if (key === "ENTER") {
      onEnter();
    } else if (key === "DEL") {
      onDelete();
    } else {
      onKey(key);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((key) => {
            const state = letterStates[key.toLowerCase()] || "default";
            const colorClass = stateColors[state] || stateColors.default;
            const isWide = key === "ENTER" || key === "DEL";

            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleClick(key)}
                className={cn(
                  "h-12 rounded-lg border font-display font-bold text-sm flex items-center justify-center transition-colors",
                  isWide ? "px-3 min-w-[60px]" : "w-9 sm:w-10",
                  colorClass
                )}
              >
                {key === "DEL" ? <Delete size={18} /> : key}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
