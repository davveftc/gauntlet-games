"use client";
import { cn } from "@/lib/utils";
import type { LeaderboardPeriod } from "@/types";

interface LeaderboardTabsProps {
  active: LeaderboardPeriod;
  onChange: (period: LeaderboardPeriod) => void;
}

const TABS: { label: string; value: LeaderboardPeriod }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "All Time", value: "alltime" },
];

export default function LeaderboardTabs({ active, onChange }: LeaderboardTabsProps) {
  return (
    <div className="flex gap-2 mb-6">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl font-display font-bold text-sm transition-all",
            active === tab.value
              ? "bg-primary text-white"
              : "bg-surface/30 text-muted hover:bg-primary/10"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
