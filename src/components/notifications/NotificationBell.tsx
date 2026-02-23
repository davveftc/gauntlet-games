"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { getNotifications, getUnreadCount, markNotificationRead } from "@/lib/notifications-db";
import type { Notification } from "@/types";

export default function NotificationBell() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const count = await getUnreadCount(user.uid);
      setUnreadCount(count);
    };
    load();
    // Poll every 30s
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    if (!user) return;
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      const notifs = await getNotifications(user.uid);
      setNotifications(notifs.slice(0, 10));
    }
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    setShowDropdown(false);

    // Navigate based on type
    if (notif.type === "chain_turn" || notif.type === "chain_result" || notif.type === "chain_invite") {
      router.push("/chain");
    } else if (notif.type === "friend_request") {
      router.push("/friends");
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-muted hover:text-white hover:bg-primary/20 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto rounded-xl bg-surface/95 backdrop-blur-xl border border-primary/20 shadow-2xl z-50"
          >
            <div className="p-3 border-b border-dim/10">
              <h3 className="font-display text-sm font-bold">Notifications</h3>
            </div>

            {notifications.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-dim text-xs">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full text-left p-3 border-b border-dim/5 hover:bg-primary/5 transition-colors ${
                      !notif.read ? "bg-accent/5" : ""
                    }`}
                  >
                    <p className="text-sm font-medium mb-0.5">
                      {!notif.read && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mr-1.5 align-middle" />
                      )}
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted line-clamp-2">{notif.body}</p>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setShowDropdown(false);
                router.push("/notifications");
              }}
              className="w-full p-2.5 text-center text-xs text-accent hover:bg-accent/5 transition-colors"
            >
              View All
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
