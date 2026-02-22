"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/shared/Button";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="pt-6 pb-4">
      <TopBar />

      <h2 className="font-display text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-4">
        <div className="glass-card p-4">
          <h3 className="font-display font-bold mb-2">Account</h3>
          {user ? (
            <div className="space-y-3">
              <p className="text-muted text-sm">Signed in as <span className="text-white">{user.email}</span></p>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-muted text-sm mb-3">Playing as guest</p>
              <Button variant="primary" size="sm" onClick={() => router.push("/login")}>
                Sign In to Save Progress
              </Button>
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <h3 className="font-display font-bold mb-2">About</h3>
          <p className="text-muted text-sm">Gauntlet v1.0.0</p>
          <p className="text-dim text-xs mt-1">Daily games inspired by your favorites. Play, compete, survive.</p>
        </div>
      </div>
    </div>
  );
}
