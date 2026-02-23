"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import AuthGuard from "@/components/auth/AuthGuard";
import FriendList from "@/components/friends/FriendList";
import FriendRequests from "@/components/friends/FriendRequests";
import AddFriend from "@/components/friends/AddFriend";
import GameNav from "@/components/layout/GameNav";

const TABS = ["Friends", "Requests", "Add"] as const;
type Tab = (typeof TABS)[number];

export default function FriendsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("Friends");

  return (
    <AuthGuard requireAuth>
      <div className="pt-6 max-w-sm mx-auto">
        <GameNav />

        <h1 className="font-display text-2xl font-bold neon-text text-center mb-4">
          Friends
        </h1>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-surface/30 border border-dim/20 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {user && tab === "Friends" && <FriendList uid={user.uid} />}
        {user && tab === "Requests" && <FriendRequests uid={user.uid} />}
        {user && tab === "Add" && <AddFriend uid={user.uid} />}
      </div>
    </AuthGuard>
  );
}
