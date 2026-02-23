"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/notifications-db";
import AuthGuard from "@/components/auth/AuthGuard";
import GameNav from "@/components/layout/GameNav";
import Button from "@/components/shared/Button";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const notifs = await getNotifications(user.uid);
      setNotifications(notifs);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    if (notif.type === "chain_turn" || notif.type === "chain_result" || notif.type === "chain_invite") {
      router.push("/chain");
    } else if (notif.type === "friend_request") {
      router.push("/friends");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthGuard requireAuth>
      <div className="pt-6 max-w-sm mx-auto">
        <GameNav />

        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-bold neon-text">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-muted text-sm animate-pulse py-8">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleClick(notif)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  notif.read
                    ? "bg-surface/20 border-dim/10"
                    : "bg-accent/5 border-accent/20"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!notif.read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-0.5">{notif.title}</p>
                    <p className="text-xs text-muted">{notif.body}</p>
                    <p className="text-[10px] text-dim mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
