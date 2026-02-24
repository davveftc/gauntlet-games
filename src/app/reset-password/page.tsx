"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/shared/Button";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 w-full max-w-sm text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Password updated</h1>
          <p className="text-muted text-sm">
            Your password has been reset. Redirecting you home...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-center mb-2">
          Set new password
        </h1>
        <p className="text-muted text-center text-sm mb-8">
          Enter your new password below.
        </p>

        {error && (
          <p className="text-error text-sm text-center mb-4 bg-error/10 rounded-lg p-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
