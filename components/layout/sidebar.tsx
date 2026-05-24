"use client";

import {
  ArrowUpDown,
  ClipboardCheck,
  Info,
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AboutDialog, APP_VERSION } from "./about-dialog";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  /** Uppercase label shown above the items when sidebar is expanded. */
  title: string;
  items: NavItem[];
}

const WORKSPACE: NavSection = {
  title: "Workspace",
  items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/parts", label: "Master Part", icon: Package },
    { href: "/movements", label: "Stock Movement", icon: ArrowUpDown },
    { href: "/search", label: "Part Search", icon: Search },
    { href: "/stock-taking", label: "Stock Taking", icon: ClipboardCheck },
  ],
};

const USERS_NAV: NavItem = {
  href: "/users",
  label: "User Management",
  icon: Users,
};
const ACCOUNT_NAV: NavItem = {
  href: "/account",
  label: "Account",
  icon: UserCircle,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isAdmin: boolean;
}

export function Sidebar({ collapsed, onToggle, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const [aboutOpen, setAboutOpen] = useState(false);

  // Build the "Pengaturan" section based on role. Account always present;
  // User Management appended for admin / superadmin only.
  const settingsItems: NavItem[] = isAdmin
    ? [ACCOUNT_NAV, USERS_NAV]
    : [ACCOUNT_NAV];

  const renderItem = (item: NavItem) => {
    const active =
      pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;

    const link = (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md text-sm font-medium transition-colors",
          collapsed ? "h-10 justify-center px-0" : "px-3 py-2",
          active
            ? collapsed
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50",
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (!collapsed) return link;

    // Collapsed: wrap with Radix Tooltip for styled hover labels.
    return (
      <Tooltip key={item.href} delayDuration={150}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderSection = (section: NavSection) => (
    <div key={section.title} className="space-y-1">
      {!collapsed && (
        <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          {section.title}
        </p>
      )}
      {collapsed && <div className="mx-2 my-2 border-t border-sidebar-border" />}
      {section.items.map(renderItem)}
    </div>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-[68px] items-center justify-center border-b border-sidebar-border px-4">
          <Image
            src="/Epson_logo.svg"
            alt="Epson"
            width={collapsed ? 36 : 100}
            height={collapsed ? 11 : 30}
            className="h-auto dark:brightness-0 dark:invert"
            priority
          />
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto p-2">
          {renderSection(WORKSPACE)}
          {renderSection({ title: "Pengaturan", items: settingsItems })}
        </nav>

        {/* Version pill — clickable, opens About dialog. */}
        <div className="border-t border-sidebar-border p-2">
          {collapsed ? (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setAboutOpen(true)}
                  aria-label={`Tentang aplikasi ${APP_VERSION}`}
                  className="flex h-10 w-full items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Tentang Aplikasi ({APP_VERSION})
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <span className="flex items-center gap-2">
                <Info className="h-3.5 w-3.5" />
                Tentang Aplikasi
              </span>
              <span className="rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-sidebar-accent-foreground">
                {APP_VERSION}
              </span>
            </button>
          )}
        </div>

        <div className="border-t border-sidebar-border p-2">
          <button
            type="button"
            onClick={onToggle}
            title={
              collapsed
                ? "Expand sidebar (Ctrl+B)"
                : "Collapse sidebar (Ctrl+B)"
            }
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/50",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      </aside>
    </TooltipProvider>
  );
}
