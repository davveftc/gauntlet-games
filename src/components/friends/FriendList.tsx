"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserMinus } from "lucide-react";
import { getFriends, removeFriend } from "@/lib/friends-db";
import type { Friend } from "@/types";

interface FriendListProps {
  uid: string;
}

export default function FriendList({ uid }: FriendListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const f = await getFriends(uid);
    setFriends(f);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [uid]);

  const handleRemove = async (friendUid: string) => {
    await removeFriend(uid, friendUid);
    setFriends((prev) => prev.filter((f) => f.uid !== friendUid));
  };

  if (loading) {
    return <p className="text-center text-muted text-sm animate-pulse py-8">Loading...</p>;
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted text-sm">No friends yet.</p>
        <p className="text-dim text-xs mt-1">Search for players to add them!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {friends.map((friend) => (
        <motion.div
          key={friend.uid}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 py-3 px-4 rounded-xl bg-surface/30 border border-dim/20"
        >
          <div className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold">
            {friend.displayName[0]?.toUpperCase()}
          </div>
          <span className="flex-1 text-sm font-medium">{friend.displayName}</span>
          <button
            onClick={() => handleRemove(friend.uid)}
            className="p-2 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors"
          >
            <UserMinus size={16} />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
