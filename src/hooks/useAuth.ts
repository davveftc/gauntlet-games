"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getUserProfile } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/types";

export function useAuth() {
  const { user, loading, isGuest, setUser, setLoading, setGuest } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.display_name || session.user.user_metadata?.full_name
        );
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadUserProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.display_name || session.user.user_metadata?.full_name
          );
          setGuest(false);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, setGuest]);

  async function loadUserProfile(uid: string, email?: string | null, displayName?: string | null) {
    const profile = await getUserProfile(uid);
    if (profile) {
      setUser({
        uid,
        email: email || null,
        displayName: profile.displayName || displayName || "Player",
        avatar: profile.avatar || "default",
        level: profile.level || 1,
        xp: profile.xp || 0,
        joinDate: profile.joinDate || new Date().toISOString().split("T")[0],
      } as User);
    } else {
      setUser({
        uid,
        email: email || null,
        displayName: displayName || "Player",
        avatar: "default",
        level: 1,
        xp: 0,
        joinDate: new Date().toISOString().split("T")[0],
      } as User);
    }
  }

  return { user, loading, isGuest };
}
