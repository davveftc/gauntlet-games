"use client";
import { motion } from "framer-motion";
import { xpForLevel } from "@/types";

interface XPBarProps {
  xp: number;
  level: number;
}

export default function XPBar({ xp, level }: XPBarProps) {
  const xpInLevel = xp % 500;
  const xpNeeded = xpForLevel(level);
  const progress = (xpInLevel / 500) * 100;

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display font-bold text-lg">Level {level}</span>
        <span className="text-muted text-sm">{xpInLevel} / 500 XP</span>
      </div>
      <div className="w-full h-3 bg-deep rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="text-dim text-xs mt-2">Total XP: {xp}</p>
    </div>
  );
}
