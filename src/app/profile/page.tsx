"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/layout/TopBar";
import XPBar from "@/components/profile/XPBar";
import StatsGrid from "@/components/profile/StatsGrid";
import StreakDisplay from "@/components/profile/StreakDisplay";
import UnlocksGrid from "@/components/profile/UnlocksGrid";
import Button from "@/components/shared/Button";
import Link from "next/link";
import { LogOut } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { xp, level, streaks, unlocks, totalGamesPlayed, totalWins, gauntletSurvivals } = useProfileStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="pt-6 min-h-[80vh] flex flex-col items-center justify-center text-center">
        <TopBar />
        <h2 className="font-display text-2xl font-bold mb-2">Sign in to view your profile</h2>
        <p className="text-muted mb-6">Track stats, streaks, and unlock cosmetics</p>
        <Link href="/login">
          <Button variant="primary" size="lg">Sign In</Button>
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Games Played", value: totalGamesPlayed, icon: "\u{1F3AE}" },
    { label: "Wins", value: totalWins, icon: "\u{1F3C6}" },
    { label: "Win Rate", value: totalGamesPlayed > 0 ? `${Math.round((totalWins / totalGamesPlayed) * 100)}%` : "0%", icon: "\u{1F4C8}" },
    { label: "Gauntlet Survivals", value: gauntletSurvivals, icon: "\u2694\uFE0F" },
  ];

  return (
    <div className="pt-6 pb-4">
      <TopBar />

      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-3">
          <span className="text-3xl">{user.avatar === "default" ? "\u{1F464}" : "\u{1F31F}"}</span>
        </div>
        <h2 className="font-display text-xl font-bold">{user.displayName}</h2>
        <p className="text-muted text-sm">Joined {user.joinDate}</p>
      </div>

      <XPBar xp={xp} level={level} />
      <div className="mb-6">
        <StatsGrid stats={stats} />
      </div>
      <div className="mb-6">
        <StreakDisplay streaks={streaks} />
      </div>
      <UnlocksGrid unlocks={unlocks} />

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface/30 border border-dim/20 text-muted hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
