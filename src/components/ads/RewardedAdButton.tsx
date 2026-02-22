"use client";
import Button from "@/components/shared/Button";
import { useAdStore } from "@/stores/adStore";
import { useAuthStore } from "@/stores/authStore";
import { addXP } from "@/lib/db";
import { XP_REWARDS } from "@/types";

interface RewardedAdButtonProps {
  label?: string;
  onReward?: () => void;
}

export default function RewardedAdButton({
  label = "Watch Ad for +25 XP",
  onReward,
}: RewardedAdButtonProps) {
  const { rewardedAdsWatchedToday, recordRewardedAd } = useAdStore();
  const { user } = useAuthStore();

  if (rewardedAdsWatchedToday >= 5) return null;

  const handleClick = async () => {
    recordRewardedAd();
    if (user) {
      await addXP(user.uid, XP_REWARDS.WATCH_AD);
    }
    onReward?.();
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      {label}
    </Button>
  );
}
