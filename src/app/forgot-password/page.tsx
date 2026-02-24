"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Button from "@/components/shared/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
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
