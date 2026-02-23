"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, RotateCw } from "lucide-react";
import Button from "@/components/shared/Button";
import { getFriends } from "@/lib/friends-db";
import type { Friend, Chain } from "@/types";

interface ChainNominateProps {
  chain: Chain;
  currentUid: string;
  onNominate: (friendUid: string) => void;
  onCycle: () => void;
}

export default function ChainNominate({
  chain,
  currentUid,
  onNominate,
  onCycle,
}: ChainNominateProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const f = await getFriends(currentUid);
      setFriends(f);
      setLoading(false);
    };
    load();
  }, [currentUid]);

  // Filter friends by search and exclude those already in today's chain
  const chainUids = new Set(chain.links.map((l) => l.uid));
  const filteredFriends = friends.filter((f) => {
    const matchesSearch = f.displayName.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const alreadyInChain = (uid: string) => chainUids.has(uid);

  return (
    <div className="pt-6 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold neon-text mb-2">
          Nominate Next Player
        </h2>
        <p className="text-muted text-sm">
          Choose a friend to play the next link, or cycle back to an existing player.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search friends..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface/50 border border-dim/20 text-white placeholder:text-dim text-sm focus:outline-none focus:border-accent/40"
        />
      </div>

      {/* Friends list */}
      {loading ? (
        <p className="text-center text-muted text-sm animate-pulse">Loading friends...</p>
      ) : filteredFriends.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-muted text-sm mb-3">
            {friends.length === 0 ? "No friends yet. Add friends to invite them!" : "No friends match your search."}
          </p>
          {friends.length === 0 && (
            <a href="/friends" className="text-accent text-sm hover:underline">
              Add Friends
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {filteredFriends.map((friend) => {
            const inChain = alreadyInChain(friend.uid);
            return (
              <motion.button
                key={friend.uid}
                whileTap={{ scale: 0.98 }}
                onClick={() => !inChain && onNominate(friend.uid)}
                disabled={inChain}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl border transition-all ${
                  inChain
                    ? "bg-surface/20 border-dim/10 opacity-40 cursor-not-allowed"
                    : "bg-surface/30 border-dim/20 hover:border-accent/30 hover:bg-accent/5"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold">
                  {friend.displayName[0]?.toUpperCase()}
                </div>
                <span className="flex-1 text-left text-sm font-medium">
                  {friend.displayName}
                </span>
                {inChain ? (
                  <span className="text-xs text-dim">Already in chain</span>
                ) : (
                  <UserPlus size={16} className="text-accent" />
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Cycle option */}
      <div className="border-t border-dim/20 pt-4">
        <Button
          variant="ghost"
          size="md"
          onClick={onCycle}
          className="w-full"
        >
          <RotateCw size={16} className="inline mr-2" />
          Cycle Back (Auto-Assign)
        </Button>
        <p className="text-xs text-dim text-center mt-2">
          Assigns the next link to an existing chain participant
        </p>
      </div>
    </div>
  );
}
