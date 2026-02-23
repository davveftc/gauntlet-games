"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, Check, Loader } from "lucide-react";
import { searchUsers, sendFriendRequest } from "@/lib/friends-db";
import { createNotification } from "@/lib/notifications-db";

interface AddFriendProps {
  uid: string;
}

export default function AddFriend({ uid }: AddFriendProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ uid: string; displayName: string; avatar: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (query.length < 2) return;
    setSearching(true);
    setError(null);
    const users = await searchUsers(query, uid);
    setResults(users);
    setSearching(false);
  };

  const handleSend = async (toUid: string, toName: string) => {
    const result = await sendFriendRequest(uid, toUid);
    if (result.success) {
      setSentTo((prev) => new Set(prev).add(toUid));
      await createNotification(
        toUid,
        "friend_request",
        "Friend Request",
        "You have a new friend request!",
        { fromUid: uid }
      );
    } else {
      setError(result.error || "Failed to send request");
    }
  };

  return (
    <div>
      {/* Search input */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface/50 border border-dim/20 text-white placeholder:text-dim text-sm focus:outline-none focus:border-accent/40"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSearch}
          disabled={searching || query.length < 2}
          className="px-4 py-2.5 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm font-medium disabled:opacity-50"
        >
          {searching ? <Loader size={16} className="animate-spin" /> : "Search"}
        </motion.button>
      </div>

      {error && (
        <p className="text-error text-xs mb-3">{error}</p>
      )}

      {/* Results */}
      <div className="space-y-2">
        {results.map((user) => {
          const sent = sentTo.has(user.uid);
          return (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 py-3 px-4 rounded-xl bg-surface/30 border border-dim/20"
            >
              <div className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold">
                {user.displayName[0]?.toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-medium">{user.displayName}</span>
              <button
                onClick={() => handleSend(user.uid, user.displayName)}
                disabled={sent}
                className={`p-2 rounded-lg transition-colors ${
                  sent
                    ? "text-success bg-success/10"
                    : "text-accent hover:bg-accent/10"
                }`}
              >
                {sent ? <Check size={16} /> : <UserPlus size={16} />}
              </button>
            </motion.div>
          );
        })}
      </div>

      {results.length === 0 && query.length >= 2 && !searching && (
        <p className="text-center text-dim text-xs mt-4">No players found.</p>
      )}
    </div>
  );
}
