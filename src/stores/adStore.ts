import { create } from "zustand";

interface AdState {
  lastInterstitialTime: number;
  rewardedAdsWatchedToday: number;
  canShowInterstitial: () => boolean;
  recordInterstitial: () => void;
  recordRewardedAd: () => void;
}

export const useAdStore = create<AdState>((set, get) => ({
  lastInterstitialTime: 0,
  rewardedAdsWatchedToday: 0,
  canShowInterstitial: () => Date.now() - get().lastInterstitialTime > 60000,
  recordInterstitial: () => set({ lastInterstitialTime: Date.now() }),
  recordRewardedAd: () =>
    set((s) => ({
      rewardedAdsWatchedToday: s.rewardedAdsWatchedToday + 1,
    })),
}));
