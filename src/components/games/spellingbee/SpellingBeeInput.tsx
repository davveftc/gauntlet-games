"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/shared/Button";

interface SpellingBeeInputProps {
  onSubmit: (spelling: string) => void;
  disabled?: boolean;
}

export default function SpellingBeeInput({ onSubmit, disabled }: SpellingBeeInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const spelling = input.trim().toLowerCase();
    if (spelling.length === 0) return;
    onSubmit(spelling);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your spelling..."
        disabled={disabled}
        className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-4 text-white text-center text-xl font-display placeholder:text-dim focus:outline-none focus:border-primary disabled:opacity-50 tracking-widest"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={disabled || input.trim().length === 0}
      >
        Submit Spelling
      </Button>
    </form>
  );
}
