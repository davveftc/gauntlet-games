import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateWordlessShareText(
  puzzleNumber: number,
  guesses: string[][],
  won: boolean,
  maxGuesses: number
): string {
  const grid = guesses
    .map((row) =>
      row
        .map((state) => {
          if (state === "correct") return "\u{1F7E9}";
          if (state === "present") return "\u{1F7E8}";
          return "\u2B1B";
        })
        .join("")
    )
    .join("\n");

  return `\u{1F7EA} GAUNTLET \u2014 Wordless #${puzzleNumber}\n${won ? guesses.length : "X"}/${maxGuesses}\n\n${grid}\n\nPlay at https://gauntlet-games.vercel.app/`;
}

export function generateGauntletShareText(
  survived: boolean,
  completedCount: number,
  total: number,
  totalPoints: number
): string {
  const swords = survived ? "\u2694\uFE0F" : "\u{1F480}";
  const bars = Array.from({ length: total }, (_, i) =>
    i < completedCount ? "\u{1F7E9}" : "\u{1F7E5}"
  ).join("");

  const pointsStr = survived ? ` | ${totalPoints} pts (${total}× multiplier)` : "";
  return `${swords} GAUNTLET \u2014 ${survived ? "SURVIVED" : "ELIMINATED"}\n${bars}\n${completedCount}/${total} games cleared${pointsStr}\n\nPlay at https://gauntlet-games.vercel.app/`;
}

export function generateChainShareText(
  survived: boolean,
  totalLinks: number,
  totalScore: number,
  links: { gameId: string; result: string; displayName: string }[]
): string {
  const icon = survived ? "\u{1F517}" : "\u26D3\uFE0F";
  const bars = links
    .map((l) => (l.result === "win" ? "\u2705" : l.result === "loss" ? "\u274C" : "\u2B1C"))
    .join("");

  const completedCount = links.filter((l) => l.result === "win").length;

  if (survived) {
    return `${icon} THE CHAIN \u2014 ALL LINKS HELD!\n${bars}\nTotal Score: ${totalScore} (4\u00D7 multiplier)\n\nPlay at https://gauntlet-games.vercel.app/`;
  }

  return `${icon} THE CHAIN \u2014 BROKEN\n${bars}\nChain broke at link ${completedCount + 1}/${totalLinks}\n\nPlay at https://gauntlet-games.vercel.app/`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}
