"use client";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/shared/Button";

export default function AdminPage() {
  const { user } = useAuthStore();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  if (!user) {
    return (
      <div className="pt-6 text-center">
        <TopBar />
        <p className="text-muted mt-12">Sign in to access admin dashboard</p>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-4">
      <TopBar />

      <h2 className="font-display text-2xl font-bold mb-6">Admin Dashboard</h2>

      <div className="space-y-4">
        <div className="glass-card p-4">
          <h3 className="font-display font-bold mb-3">Daily Content Editor</h3>
          <label className="block text-sm text-muted mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-2 text-white mb-4"
          />
          <p className="text-dim text-xs">Content editing will be connected to Firestore in production.</p>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-display font-bold mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface/30 rounded-lg p-3 text-center">
              <p className="font-display text-xl font-bold text-accent">--</p>
              <p className="text-muted text-xs">Total Users</p>
            </div>
            <div className="bg-surface/30 rounded-lg p-3 text-center">
              <p className="font-display text-xl font-bold text-accent">--</p>
              <p className="text-muted text-xs">Games Today</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-display font-bold mb-3">Ad Revenue</h3>
          <p className="text-muted text-sm">Check Google AdSense dashboard for revenue data.</p>
        </div>
      </div>
    </div>
  );
}
