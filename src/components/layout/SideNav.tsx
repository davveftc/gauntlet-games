"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Trophy, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSideNav } from "./SideNavContext";

const links = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/gauntlet", icon: Swords, label: "Gauntlet" },
  { href: "/leaderboard", icon: Trophy, label: "Ranks" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function SideNav() {
  const pathname = usePathname();
  const { open, close } = useSideNav();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="hidden lg:block fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="hidden lg:flex fixed top-0 left-0 bottom-0 z-50 w-72 flex-col bg-surface/95 backdrop-blur-xl border-r border-primary/20"
          >
            <div className="flex items-center justify-between p-6 border-b border-primary/10">
              <Link href="/" onClick={close}>
                <h2 className="font-display text-xl font-bold neon-text">GAUNTLET</h2>
              </Link>
              <button
                onClick={close}
                className="p-2 rounded-lg text-muted hover:text-white hover:bg-primary/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-1">
              {links.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={close}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      active
                        ? "bg-primary/20 text-accent"
                        : "text-muted hover:text-white hover:bg-primary/10"
                    )}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                    <span className="font-medium">{label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-primary/10">
              <p className="text-dim text-xs text-center">Daily Games</p>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
