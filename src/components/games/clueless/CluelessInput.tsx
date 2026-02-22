"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { motion } from "framer-motion";

interface CluelessInputProps {
  onGuess: (word: string) => void;
  disabled?: boolean;
}

export default function CluelessInput({ onGuess, disabled }: CluelessInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const word = input.trim().toLowerCase();
    if (word.length === 0) return;
    onGuess(word);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a word..."
        disabled={disabled}
        className="flex-1 bg-deep/50 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary disabled:opacity-50"
        autoComplete="off"
        autoCapitalize="off"
      />
      <motion.button
        whileTap={{ scale: 0.9 }}
        type="submit"
        disabled={disabled || input.trim().length === 0}
        className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center hover:bg-primary-light transition-colors disabled:opacity-50"
      >
        <Send size={18} />
      </motion.button>
    </form>
  );
}
