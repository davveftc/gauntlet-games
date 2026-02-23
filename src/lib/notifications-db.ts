import { supabase } from "./supabase";
import type { Notification, NotificationType } from "@/types";

// ---- CREATE NOTIFICATION ----
export async function createNotification(
  uid: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  await supabase.from("notifications").insert({
    uid,
    type,
    title,
    body,
    data,
    read: false,
    email_sent: false,
  });
}

// ---- GET NOTIFICATIONS ----
export async function getNotifications(
  uid: string,
  unreadOnly = false
): Promise<Notification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("uid", uid)
    .order("created_at", { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((n) => ({
    id: n.id,
    uid: n.uid,
    type: n.type as NotificationType,
    title: n.title,
    body: n.body,
    data: n.data || {},
    read: n.read,
    createdAt: n.created_at,
  }));
}

// ---- GET UNREAD COUNT ----
export async function getUnreadCount(uid: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("uid", uid)
    .eq("read", false);

  if (error) return 0;
  return count || 0;
}

// ---- MARK AS READ ----
export async function markNotificationRead(notificationId: number): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
}

// ---- MARK ALL READ ----
export async function markAllNotificationsRead(uid: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("uid", uid)
    .eq("read", false);
}

// ---- SEND EMAIL NOTIFICATION ----
export async function sendChainEmail(
  toEmail: string,
  subject: string,
  body: string
): Promise<void> {
  // Uses Supabase Edge Function for email delivery
  // In production, this would call a Supabase Edge Function or external email API
  try {
    await supabase.functions.invoke("send-chain-email", {
      body: { to: toEmail, subject, body },
    });
  } catch {
    // Email sending is best-effort; don't block chain flow
    console.error("Failed to send chain email");
  }
}
