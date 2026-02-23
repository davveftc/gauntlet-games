"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { getFriendRequests, respondToFriendRequest } from "@/lib/friends-db";
import type { FriendRequest } from "@/types";

interface FriendRequestsProps {
  uid: string;
}

export default function FriendRequests({ uid }: FriendRequestsProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const reqs = await getFriendRequests(uid);
      setRequests(reqs);
      setLoading(false);
    };
    load();
  }, [uid]);

  const handleRespond = async (requestId: number, accept: boolean) => {
    await respondToFriendRequest(requestId, accept);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  if (loading) {
    return <p className="text-center text-muted text-sm animate-pulse py-8">Loading...</p>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted text-sm">No pending friend requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => (
        <motion.div
          key={req.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 py-3 px-4 rounded-xl bg-surface/30 border border-dim/20"
        >
          <div className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold">
            {req.fromDisplayName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{req.fromDisplayName}</p>
            <p className="text-xs text-dim">wants to be friends</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRespond(req.id, true)}
              className="p-2 rounded-lg text-success hover:bg-success/10 transition-colors"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => handleRespond(req.id, false)}
              className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
