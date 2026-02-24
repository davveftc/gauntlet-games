"use client";
import { useState, useEffect } from "react";
import { ShieldAlert, Shield, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import AdminTabs from "@/components/admin/AdminTabs";
import OverviewTab from "@/components/admin/OverviewTab";
import UsersTab from "@/components/admin/UsersTab";
import GamesTab from "@/components/admin/GamesTab";
import ContentTab from "@/components/admin/ContentTab";
import AdminsTab from "@/components/admin/AdminsTab";
import type { AdminTab } from "@/components/admin/AdminTabs";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Check admin status when user changes
  useEffect(() => {
    if (!user?.email) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    const checkAdmin = async () => {
      setChecking(true);
      const { data } = await supabase
        .from("admin_emails")
        .select("email")
        .eq("email", user.email!.toLowerCase())
        .single();
      setIsAdmin(!!data);
      setChecking(false);
    };

    checkAdmin();
  }, [user?.email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoginError(error.message);
    }
    // Auth state change will be picked up by the auth store listener

    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Loading state (waiting for auth session or admin check)
  if (authLoading || (checking && user)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-primary-light font-display text-xl">
          Verifying access...
        </div>
      </div>
    );
  }

  // Not authenticated — show admin login form
  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
              <Shield size={32} className="text-accent" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-1">Admin Login</h1>
            <p className="text-muted text-sm">Sign in with your admin credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-muted mb-1">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface/30 border border-dim/20 text-white placeholder:text-dim/50 focus:outline-none focus:border-accent/50 transition-colors"
                placeholder="admin@gauntlet.gg"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-muted mb-1">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface/30 border border-dim/20 text-white placeholder:text-dim/50 focus:outline-none focus:border-accent/50 transition-colors"
                placeholder="Enter password"
              />
            </div>

            {loginError && (
              <p className="text-error text-sm text-center">{loginError}</p>
            )}

            <div className="text-right">
              <a
                href="/forgot-password"
                className="text-accent text-sm hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 rounded-xl font-display font-bold bg-primary hover:bg-primary-light text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated but not admin — show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <ShieldAlert size={48} className="text-error mb-4" />
        <h2 className="font-display text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted text-sm mb-6">
          {user.email} does not have admin access.
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/30 border border-dim/20 text-muted hover:text-white hover:bg-primary/10 transition-colors text-sm"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Admin Dashboard</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{user.email}</span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-muted hover:text-white hover:bg-primary/20 transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <AdminTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "games" && <GamesTab />}
      {activeTab === "content" && <ContentTab />}
      {activeTab === "admins" && <AdminsTab currentEmail={user.email} />}
    </div>
  );
}
