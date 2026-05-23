"use client";

import { Bell, Menu, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import { ThemeToggle } from "./theme-toggle";
import { UserDropdown } from "./user-dropdown";

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "Selamat pagi";
  if (h >= 11 && h < 15) return "Selamat siang";
  if (h >= 15 && h < 18) return "Selamat sore";
  return "Selamat malam";
}

interface NavbarProps {
  user: { nik: string; fullName: string; role: UserRole };
  onToggleSidebar: () => void;
}

/** Sticky top bar — greeting, refresh (5s cooldown), bell, theme, user menu. */
export function Navbar({ user, onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [cooldown, setCooldown] = useState(false);
  const firstName = user.fullName.split(" ")[0];

  const handleRefresh = () => {
    if (cooldown) return;
    startRefresh(() => router.refresh());
    setCooldown(true);
    setTimeout(() => setCooldown(false), 5000);
  };

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={onToggleSidebar}
        aria-label="Collapse sidebar"
        title="Collapse sidebar (Ctrl+B)"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <p className="truncate text-xl md:text-2xl font-medium tracking-tight">
        {greeting()}, <strong>{firstName}</strong> 👋
      </p>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={handleRefresh}
          disabled={cooldown}
          aria-label="Refresh data"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label="Notifikasi"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <UserDropdown user={user} />
      </div>
    </header>
  );
}
