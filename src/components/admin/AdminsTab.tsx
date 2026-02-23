"use client";
import { useState, useEffect } from "react";
import { Trash2, Plus, Shield } from "lucide-react";

interface AdminEmail {
  email: string;
  added_at: string;
  added_by: string | null;
}

interface AdminsTabProps {
  currentEmail: string | null;
}

export default function AdminsTab({ currentEmail }: AdminsTabProps) {
  const [admins, setAdmins] = useState<AdminEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchAdmins = async () => {
    const res = await fetch("/api/admin/admins");
    if (res.ok) {
      const data = await res.json();
      setAdmins(data.admins);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAdding(true);
    setError(null);

    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim() }),
    });

    if (res.ok) {
      setNewEmail("");
      await fetchAdmins();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add admin");
    }

    setAdding(false);
  };

  const handleRemove = async (email: string) => {
    setRemoving(email);
    setError(null);

    const res = await fetch("/api/admin/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      await fetchAdmins();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to remove admin");
    }

    setRemoving(null);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted animate-pulse">Loading admins...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Shield size={20} className="text-accent" />
        <h3 className="font-display font-bold text-lg">Admin Email Whitelist</h3>
        <span className="text-xs text-muted bg-surface/30 px-2 py-0.5 rounded-full">
          {admins.length} admin{admins.length !== 1 ? "s" : ""}
        </span>
      </div>

      <p className="text-muted text-sm">
        Users with these email addresses can access the admin dashboard and API.
      </p>

      {/* Add new admin */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter email address"
          required
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface/30 border border-dim/20 text-white placeholder:text-dim/50 focus:outline-none focus:border-accent/50 transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={adding || !newEmail.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-bold text-sm bg-primary hover:bg-primary-light text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          {adding ? "Adding..." : "Add"}
        </button>
      </form>

      {error && (
        <p className="text-error text-sm">{error}</p>
      )}

      {/* Admin list */}
      <div className="space-y-2">
        {admins.map((admin) => {
          const isYou = admin.email.toLowerCase() === currentEmail?.toLowerCase();

          return (
            <div
              key={admin.email}
              className="flex items-center gap-3 py-3 px-4 rounded-xl bg-surface/20 border border-dim/10"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <Shield size={14} className="text-accent" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {admin.email}
                  {isYou && (
                    <span className="ml-2 text-xs text-accent">(you)</span>
                  )}
                </p>
                <p className="text-xs text-dim">
                  Added {new Date(admin.added_at).toLocaleDateString()}
                  {admin.added_by && ` by ${admin.added_by}`}
                </p>
              </div>

              {!isYou && (
                <button
                  onClick={() => handleRemove(admin.email)}
                  disabled={removing === admin.email}
                  className="p-2 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                  title="Remove admin"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
