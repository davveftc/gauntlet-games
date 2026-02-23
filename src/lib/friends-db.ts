import { supabase } from "./supabase";
import type { Friend, FriendRequest } from "@/types";

// ---- GET FRIENDS ----
export async function getFriends(uid: string): Promise<Friend[]> {
  // Get friendships where user is either side
  const { data, error } = await supabase
    .from("friends")
    .select("uid, friend_uid")
    .or(`uid.eq.${uid},friend_uid.eq.${uid}`);

  if (error || !data || data.length === 0) return [];

  // Collect friend UIDs
  const friendUids = data.map((row) =>
    row.uid === uid ? row.friend_uid : row.uid
  );

  if (friendUids.length === 0) return [];

  // Fetch friend profiles
  const { data: profiles } = await supabase
    .from("users")
    .select("uid, display_name, avatar")
    .in("uid", friendUids);

  if (!profiles) return [];

  return profiles.map((p) => ({
    uid: p.uid,
    displayName: p.display_name,
    avatar: p.avatar,
  }));
}

// ---- SEARCH USERS ----
export async function searchUsers(
  query: string,
  currentUid: string
): Promise<{ uid: string; displayName: string; avatar: string }[]> {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from("users")
    .select("uid, display_name, avatar")
    .ilike("display_name", `%${query}%`)
    .neq("uid", currentUid)
    .limit(20);

  if (error || !data) return [];

  return data.map((u) => ({
    uid: u.uid,
    displayName: u.display_name,
    avatar: u.avatar,
  }));
}

// ---- SEND FRIEND REQUEST ----
export async function sendFriendRequest(
  fromUid: string,
  toUid: string
): Promise<{ success: boolean; error?: string }> {
  // Check if already friends
  const { data: existing } = await supabase
    .from("friends")
    .select("id")
    .or(
      `and(uid.eq.${fromUid},friend_uid.eq.${toUid}),and(uid.eq.${toUid},friend_uid.eq.${fromUid})`
    )
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: "Already friends" };
  }

  // Check if request already exists
  const { data: existingReq } = await supabase
    .from("friend_requests")
    .select("id, status")
    .or(
      `and(from_uid.eq.${fromUid},to_uid.eq.${toUid}),and(from_uid.eq.${toUid},to_uid.eq.${fromUid})`
    )
    .eq("status", "pending")
    .limit(1);

  if (existingReq && existingReq.length > 0) {
    return { success: false, error: "Request already pending" };
  }

  const { error } = await supabase.from("friend_requests").insert({
    from_uid: fromUid,
    to_uid: toUid,
    status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---- GET FRIEND REQUESTS ----
export async function getFriendRequests(uid: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, from_uid, to_uid, status, created_at")
    .eq("to_uid", uid)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  // Fetch sender profiles
  const fromUids = data.map((r) => r.from_uid);
  const { data: profiles } = await supabase
    .from("users")
    .select("uid, display_name, avatar")
    .in("uid", fromUids);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.uid, p])
  );

  return data.map((r) => {
    const profile = profileMap.get(r.from_uid);
    return {
      id: r.id,
      fromUid: r.from_uid,
      fromDisplayName: profile?.display_name || "Player",
      fromAvatar: profile?.avatar || "default",
      toUid: r.to_uid,
      status: r.status,
      createdAt: r.created_at,
    };
  });
}

// ---- RESPOND TO FRIEND REQUEST ----
export async function respondToFriendRequest(
  requestId: number,
  accept: boolean
): Promise<{ success: boolean; error?: string }> {
  const { data: request } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request) return { success: false, error: "Request not found" };

  // Update request status
  await supabase
    .from("friend_requests")
    .update({ status: accept ? "accepted" : "rejected" })
    .eq("id", requestId);

  // If accepted, create the friendship (bidirectional)
  if (accept) {
    await supabase.from("friends").insert({
      uid: request.from_uid,
      friend_uid: request.to_uid,
    });
  }

  return { success: true };
}

// ---- REMOVE FRIEND ----
export async function removeFriend(
  uid: string,
  friendUid: string
): Promise<void> {
  await supabase
    .from("friends")
    .delete()
    .or(
      `and(uid.eq.${uid},friend_uid.eq.${friendUid}),and(uid.eq.${friendUid},friend_uid.eq.${uid})`
    );
}
