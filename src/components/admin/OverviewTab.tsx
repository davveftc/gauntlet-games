"use client";
import { useState, useEffect } from "react";
import { Users, Gamepad2, Trophy, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import type { AdminStats } from "@/lib/admin-db";

const STAT_CARDS = [
  { key: "totalUsers" as const, label: "Total Users", icon: Users },
  { key: "gamesToday" as const, label: "Games Today", icon: Gamepad2 },
  { key: "gamesAllTime" as const, label: "All-Time Games", icon: Trophy },
  { key: "activeChains" as const, label: "Active Chains", icon: Link2 },
];

export default function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      {STAT_CARDS.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 text-center"
          >
            <Icon size={24} className="text-primary mx-auto mb-2" />
            {loading ? (
              <div className="h-8 w-16 mx-auto bg-surface/30 rounded animate-pulse" />
            ) : (
              <p className="font-display text-2xl font-bold text-accent">
                {(stats?.[card.key] ?? 0).toLocaleString()}
              </p>
            )}
            <p className="text-muted text-xs mt-1">{card.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
