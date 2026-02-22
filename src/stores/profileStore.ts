import { create } from "zustand";
import type { UserStreaks } from "@/types";

interface ProfileState {
  xp: number;
  level: number;
  streaks: UserStreaks | null;
  unlocks: string[];
  totalGamesPlayed: number;
  totalWins: number;
  gauntletSurvivals: number;
  setProfile: (data: Partial<ProfileState>) => void;
  addXP: (amount: number) => void;
}

const defaultStreaks: UserStreaks = {
  wordless: { current: 0, longest: 0, lastPlayedDate: "" },
  songless: { current: 0, longest: 0, lastPlayedDate: "" },
  sayless: { current: 0, longest: 0, lastPlayedDate: "" },
  moreless: { current: 0, longest: 0, lastPlayedDate: "" },
  clueless: { current: 0, longest: 0, lastPlayedDate: "" },
  spellingbee: { current: 0, longest: 0, lastPlayedDate: "" },
  faceless: { current: 0, longest: 0, lastPlayedDate: "" },
  global: { current: 0, longest: 0, lastPlayedDate: "" },
  gauntlet: { current: 0, longest: 0, lastPlayedDate: "" },
};

export const useProfileStore = create<ProfileState>((set) => ({
  xp: 0,
  level: 1,
  streaks: defaultStreaks,
  unlocks: [],
  totalGamesPlayed: 0,
  totalWins: 0,
  gauntletSurvivals: 0,
  setProfile: (data) => set(data),
  addXP: (amount) =>
    set((state) => {
      const newXP = state.xp + amount;
      return { xp: newXP, level: Math.floor(newXP / 500) + 1 };
    }),
}));
