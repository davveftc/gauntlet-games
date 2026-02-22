"use client";
import dynamic from "next/dynamic";

const AuthForm = dynamic(() => import("@/components/auth/AuthForm"), {
  ssr: false,
  loading: () => (
    <div className="glass-card p-8 w-full max-w-sm text-center">
      <div className="animate-pulse text-primary-light font-display text-xl">Loading...</div>
    </div>
  ),
});

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <AuthForm />
    </div>
  );
}
