"use client";
import { Lock } from "lucide-react";

interface UnlocksGridProps {
  unlocks: string[];
}

const ALL_COSMETICS = [
  { id: "avatar_neon", name: "Neon Avatar", icon: "\u{1F31F}" },
  { id: "frame_fire", name: "Fire Frame", icon: "\u{1F525}" },
  { id: "badge_champion", name: "Champion Badge", icon: "\u{1F3C6}" },
  { id: "trail_sparkle", name: "Sparkle Trail", icon: "\u2728" },
  { id: "theme_midnight", name: "Midnight Theme", icon: "\u{1F30C}" },
  { id: "crown_gold", name: "Gold Crown", icon: "\u{1F451}" },
];

export default function UnlocksGrid({ unlocks }: UnlocksGridProps) {
  return (
    <div>
      <h3 className="font-display font-bold text-lg mb-3">Unlocks</h3>
      <div className="grid grid-cols-3 gap-3">
        {ALL_COSMETICS.map((item) => {
          const isUnlocked = unlocks.includes(item.id);
          return (
            <div
              key={item.id}
              className={`text-center p-3 rounded-xl border ${
                isUnlocked
                  ? "border-accent/30 bg-accent/5"
                  : "border-dim/20 bg-surface/20 opacity-40"
              }`}
            >
              <span className="text-2xl block mb-1">
                {isUnlocked ? item.icon : <Lock size={20} className="mx-auto text-dim" />}
              </span>
              <span className="text-xs text-muted">{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
