"use client";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import TopBar from "@/components/layout/TopBar";
import AdminTabs from "@/components/admin/AdminTabs";
import OverviewTab from "@/components/admin/OverviewTab";
import UsersTab from "@/components/admin/UsersTab";
import GamesTab from "@/components/admin/GamesTab";
import ContentTab from "@/components/admin/ContentTab";
import type { AdminTab } from "@/components/admin/AdminTabs";

const ADMIN_EMAILS = [
  "admin@gauntlet.gg",
  "davve@gauntlet.gg",
];

function isAdmin(email: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  if (!user) {
    return (
      <div className="pt-6 text-center">
        <TopBar />
        <p className="text-muted mt-12">Sign in to access admin dashboard</p>
      </div>
    );
  }

  if (!isAdmin(user.email)) {
    return (
      <div className="pt-6 text-center">
        <TopBar />
        <ShieldAlert size={48} className="text-error mx-auto mt-12 mb-4" />
        <p className="text-muted">You don&apos;t have admin access</p>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-4">
      <TopBar />

      <h2 className="font-display text-2xl font-bold mb-6">Admin Dashboard</h2>

      <AdminTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "games" && <GamesTab />}
      {activeTab === "content" && <ContentTab />}
    </div>
  );
}
