"use client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, fallback, requireAuth = false }: AuthGuardProps) {
  const { loading } = useAuth();
  const { user, isGuest } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary-light font-display text-xl">Loading...</div>
      </div>
    );
  }

  if (requireAuth && !user && !isGuest) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <h2 className="font-display text-2xl font-bold mb-2">Sign in to continue</h2>
          <p className="text-muted mb-4">Create an account to save your progress and compete on leaderboards.</p>
          <a href="/login" className="text-accent hover:underline">Sign in</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
