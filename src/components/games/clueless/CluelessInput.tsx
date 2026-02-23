"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CluelessInputProps {
  onGuess: (word: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export default function CluelessInput({ onGuess, disabled, error }: CluelessInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const word = input.trim().toLowerCase();
    if (word.length === 0) return;
    onGuess(word);
    setInput("");
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
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
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 text-sm text-error text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
