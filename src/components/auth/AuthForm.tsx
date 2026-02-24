"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createUserProfile } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/shared/Button";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  // Redirect to home once the auth store picks up the user
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || "Player" },
          },
        });
        if (authError) throw authError;
        if (data.user) {
          await createUserProfile(data.user.id, {
            displayName: displayName || "Player",
            email,
          });
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
      }
      // Don't router.push here — the AuthProvider's onAuthStateChange will
      // update the store, and the useEffect above will redirect once user is set
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) throw authError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="glass-card p-8 w-full max-w-sm">
      <h1 className="font-display text-3xl font-bold text-center mb-2 neon-text">
        GAUNTLET
      </h1>
      <p className="text-muted text-center text-sm mb-8">
        {isSignUp ? "Create your account" : "Welcome back"}
      </p>

      {error && (
        <p className="text-error text-sm text-center mb-4 bg-error/10 rounded-lg p-2">
          {error}
        </p>
      )}

      <form onSubmit={handleEmail} className="space-y-4">
        {isSignUp && (
          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary"
        />

        {!isSignUp && (
          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-accent text-sm hover:underline"
            >
              Forgot password?
            </a>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
        </Button>
      </form>

      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-primary/20" />
        <span className="px-4 text-dim text-sm">or</span>
        <div className="flex-1 h-px bg-primary/20" />
      </div>

      <Button variant="ghost" size="lg" className="w-full" onClick={handleGoogle}>
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted mt-6">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-accent hover:underline"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </button>
      </p>
    </div>
  );
}
