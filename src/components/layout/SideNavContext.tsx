"use client";
import { createContext, useContext, useState, useCallback } from "react";

interface SideNavContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const SideNavContext = createContext<SideNavContextValue>({
  open: false,
  toggle: () => {},
  close: () => {},
});

export function SideNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <SideNavContext.Provider value={{ open, toggle, close }}>
      {children}
    </SideNavContext.Provider>
  );
}

export function useSideNav() {
  return useContext(SideNavContext);
}
