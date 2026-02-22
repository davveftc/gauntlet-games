import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setGuest: (isGuest: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isGuest: false,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setGuest: (isGuest) => set({ isGuest }),
}));
