"use client";
import { cn } from "@/lib/utils";

export type AdminTab = "overview" | "users" | "games" | "content" | "admins";

interface AdminTabsProps {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
}

const TABS: { label: string; value: AdminTab }[] = [
  { label: "Overview", value: "overview" },
  { label: "Users", value: "users" },
  { label: "Games", value: "games" },
  { label: "Content", value: "content" },
  { label: "Admins", value: "admins" },
];

export default function AdminTabs({ active, onChange }: AdminTabsProps) {
  return (
    <div className="flex gap-2 mb-6">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl font-display font-bold text-sm transition-all",
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
