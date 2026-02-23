"use client";
import { Menu } from "lucide-react";
import { useSideNav } from "./SideNavContext";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function TopBar() {
  const { toggle } = useSideNav();

  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={toggle}
        className="hidden lg:flex items-center justify-center p-2 -ml-2 rounded-lg text-muted hover:text-white hover:bg-primary/20 transition-colors"
      >
        <Menu size={22} />
      </button>
      <div className="ml-auto">
        <NotificationBell />
      </div>
    </div>
  );
}
