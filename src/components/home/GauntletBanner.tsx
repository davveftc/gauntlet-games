"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";

export default function GauntletBanner() {
  return (
    <Link href="/gauntlet">
      <motion.div
        className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-secondary/30 via-primary/30 to-accent/20 border border-secondary/30 cursor-pointer group h-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10 flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
            <Swords size={24} className="text-secondary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold neon-text-pink">
              THE GAUNTLET
            </h2>
            <p className="text-muted text-xs mt-1">
              All 5 games. One wrong answer = eliminated!
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
