"use client";
import { motion } from "framer-motion";
import { Link2 } from "lucide-react";
import Button from "@/components/shared/Button";

interface ChainStartProps {
  onStart: () => void;
  loading?: boolean;
}

export default function ChainStart({ onStart, loading }: ChainStartProps) {
  return (
    <div className="pt-6 flex flex-col items-center justify-center min-h-[80vh] text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 12 }}
        className="w-24 h-24 mx-auto rounded-full bg-accent/15 border-2 border-accent/40 flex items-center justify-center mb-6"
      >
        <Link2 size={48} className="text-accent" />
      </motion.div>

      <h1 className="font-display text-4xl font-bold neon-text mb-2">
        THE CHAIN
      </h1>

      <p className="text-muted max-w-xs mb-2">
        Play together. Win together. Break the chain and everyone loses.
      </p>

      <div className="bg-surface/30 rounded-xl border border-dim/20 p-4 max-w-xs mb-6 text-left">
        <h3 className="font-display font-bold text-sm mb-2 text-accent">How it works</h3>
        <ul className="text-xs text-muted space-y-1.5">
          <li>1. You start the chain and play a randomly assigned game</li>
          <li>2. If you win, nominate a friend for the next link</li>
          <li>3. 6 games total — each player gets a different game</li>
          <li>4. If any link breaks, everyone gets 0 points</li>
          <li>5. All 6 win? Score is multiplied by 4x!</li>
        </ul>
      </div>

      <div className="space-y-3 mb-4">
        <p className="text-xs text-dim">
          One chain per day. Choose your links wisely.
        </p>
      </div>

      <Button
        variant="secondary"
        size="lg"
        glow
        onClick={onStart}
        disabled={loading}
      >
        {loading ? "Starting..." : "Start a Chain"}
      </Button>
    </div>
  );
}
