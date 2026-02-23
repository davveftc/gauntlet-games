"use client";
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import type { AdminUser } from "@/lib/admin-db";

export default function UsersTab() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUsers = (query: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    fetch(`/api/admin/users?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers("");
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(value), 300);
  };

  return (
    <div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full bg-deep/50 border border-primary/30 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-dim focus:outline-none focus:border-primary"
        />
      </div>

      <p className="text-muted text-xs mb-3">{total} user{total !== 1 ? "s" : ""} found</p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-center text-muted py-8">No users found</p>
      ) : (
        <div className="space-y-2">
          {users.map((user, i) => (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 bg-surface/30 border border-primary/10 rounded-xl px-4 py-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-dim truncate">{user.email || "No email"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-accent font-bold">Lv.{user.level}</p>
                <p className="text-xs text-muted">{user.totalWins}W / {user.totalGamesPlayed}G</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
