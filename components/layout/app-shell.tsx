"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { UserRole } from "@/lib/types";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

const STORAGE_KEY = "mia-sidebar-collapsed";
const CHANGE_EVENT = "mia-sidebar-change";

/**
 * Sidebar collapse state, backed by localStorage and shared across tabs.
 * useSyncExternalStore keeps SSR and client in sync without setState-in-effect.
 */
function useSidebarCollapsed(): [boolean, () => void] {
  const collapsed = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(CHANGE_EVENT, onChange);
      };
    },
    () => localStorage.getItem(STORAGE_KEY) === "true",
    () => false,
  );

  const toggle = useCallback(() => {
    const next = !(localStorage.getItem(STORAGE_KEY) === "true");
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [collapsed, toggle];
}

interface AppShellProps {
  user: { nik: string; fullName: string; role: UserRole };
  children: React.ReactNode;
}

/** Client shell: Sidebar + Navbar + scrollable content, with Ctrl+B toggle. */
export function AppShell({ user, children }: AppShellProps) {
  const [collapsed, toggle] = useSidebarCollapsed();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <div className="flex">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        isAdmin={user.role === "admin" || user.role === "superadmin"}
      />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <Navbar user={user} onToggleSidebar={toggle} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
