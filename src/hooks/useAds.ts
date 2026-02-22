"use client";
import { useAdStore } from "@/stores/adStore";

export function useAds() {
  const { canShowInterstitial, recordInterstitial, recordRewardedAd, rewardedAdsWatchedToday } = useAdStore();

  const showInterstitial = () => {
    if (canShowInterstitial()) {
      recordInterstitial();
      return true;
    }
    return false;
  };

  const canWatchRewardedAd = rewardedAdsWatchedToday < 5;

  return { showInterstitial, canWatchRewardedAd, recordRewardedAd };
}
