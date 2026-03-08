"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createUserProfile } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/shared/Button";

const MIN_ATTEMPT_INTERVAL_MS = 3000; // 3 seconds between attempts
const RATE_LIMIT_COOLDOWN_MS = 60000; // 60 second cooldown when rate-limited

function isRateLimitError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("email rate limit") ||
    msg.includes("over_email_send_rate_limit") ||
    msg.includes("request rate limit")
  );
}

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const lastAttemptRef = useRef(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const { user } = useAuthStore();

  // Redirect to home once the auth store picks up the user
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  // Cleanup cooldown timer
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const startCooldown = useCallback((durationMs: number) => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    const endTime = Date.now() + durationMs;
    setCooldown(Math.ceil(durationMs / 1000));
    cooldownTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        setCooldown(0);
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      } else {
        setCooldown(remaining);
      }
    }, 1000);
  }, []);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce minimum interval between attempts
    const now = Date.now();
    const timeSinceLast = now - lastAttemptRef.current;
    if (timeSinceLast < MIN_ATTEMPT_INTERVAL_MS) {
      setError(`Please wait a moment before trying again.`);
      return;
    }

    if (cooldown > 0) {
      setError(`Rate limited. Please wait ${cooldown}s before trying again.`);
      return;
    }

    setError("");
    setLoading(true);
    lastAttemptRef.current = Date.now();

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
      if (isRateLimitError(err)) {
        startCooldown(RATE_LIMIT_COOLDOWN_MS);
        setError("Too many attempts. Please wait 60 seconds before trying again.");
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (cooldown > 0) {
      setError(`Rate limited. Please wait ${cooldown}s before trying again.`);
      return;
    }
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) throw authError;
    } catch (err: unknown) {
      if (isRateLimitError(err)) {
        startCooldown(RATE_LIMIT_COOLDOWN_MS);
        setError("Too many attempts. Please wait 60 seconds before trying again.");
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    }
  };

  const isDisabled = loading || cooldown > 0;

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

      {cooldown > 0 && (
        <p className="text-amber-400 text-sm text-center mb-4 bg-amber-400/10 rounded-lg p-2">
          Cooldown: {cooldown}s remaining
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

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isDisabled}>
          {cooldown > 0
            ? `Wait ${cooldown}s...`
            : loading
              ? "Please wait..."
              : isSignUp
                ? "Sign Up"
                : "Sign In"}
        </Button>
      </form>

      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-primary/20" />
        <span className="px-4 text-dim text-sm">or</span>
        <div className="flex-1 h-px bg-primary/20" />
      </div>

      <Button variant="ghost" size="lg" className="w-full" onClick={handleGoogle} disabled={isDisabled}>
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
