"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Button from "@/components/shared/Button";

const RESET_COOLDOWN_MS = 60000; // 60s between reset email requests

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldown > 0) {
      setError(`Please wait ${cooldown}s before requesting another reset email.`);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
      );
      if (resetError) throw resetError;
      setSent(true);
      // Start cooldown after successful send to prevent rapid re-sends
      startCooldown(RESET_COOLDOWN_MS);
    } catch (err: unknown) {
      if (isRateLimitError(err)) {
        startCooldown(RESET_COOLDOWN_MS);
        setError("Too many reset requests. Please wait 60 seconds before trying again.");
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 w-full max-w-sm text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Check your email</h1>
          <p className="text-muted text-sm mb-6">
            We sent a password reset link to <strong className="text-white">{email}</strong>.
            Click the link in the email to reset your password.
          </p>
          {cooldown > 0 && (
            <p className="text-amber-400 text-sm mb-4">
              You can request another email in {cooldown}s
            </p>
          )}
          <button
            onClick={() => { setSent(false); setError(""); }}
            className="text-accent text-sm hover:underline mr-4"
            disabled={cooldown > 0}
          >
            Resend email
          </button>
          <a href="/login" className="text-accent text-sm hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-center mb-2">
          Reset password
        </h1>
        <p className="text-muted text-center text-sm mb-8">
          Enter your email and we&apos;ll send you a reset link.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading || cooldown > 0}>
            {cooldown > 0
              ? `Wait ${cooldown}s...`
              : loading
                ? "Sending..."
                : "Send reset link"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          <a href="/login" className="text-accent hover:underline">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
