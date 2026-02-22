"use client";
import { SideNavProvider } from "./SideNavContext";
import SideNav from "./SideNav";
import BottomNav from "./BottomNav";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <SideNavProvider>
      <main className="relative z-10 pb-20 lg:pb-8 max-w-lg lg:max-w-6xl mx-auto px-4 lg:px-8">
        {children}
      </main>
      <SideNav />
      <BottomNav />
    </SideNavProvider>
  );
}
