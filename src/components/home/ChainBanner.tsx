"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Link2 } from "lucide-react";

export default function ChainBanner() {
  return (
    <Link href="/chain">
      <motion.div
        className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-accent/20 via-primary/30 to-success/20 border border-accent/30 cursor-pointer group h-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-success/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10 flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
            <Link2 size={24} className="text-accent" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold neon-text">
              THE CHAIN
            </h2>
            <p className="text-muted text-xs mt-1">
              All 6 links must hold. 4x multiplier!
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
