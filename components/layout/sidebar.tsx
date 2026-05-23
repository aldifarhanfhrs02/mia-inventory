"use client";

import {
  ArrowUpDown,
  ClipboardCheck,
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
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parts", label: "Master Part", icon: Package },
  { href: "/movements", label: "Stock Movement", icon: ArrowUpDown },
  { href: "/search", label: "Part Search", icon: Search },
  { href: "/stock-taking", label: "Stock Taking", icon: ClipboardCheck },
];

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

  const renderItem = (item: NavItem) => {
    const active =
      pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50",
          collapsed && "justify-center px-0",
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
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

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {MAIN_NAV.map(renderItem)}
        <div className="my-2 border-t border-sidebar-border" />
        {isAdmin && renderItem(USERS_NAV)}
        {renderItem(ACCOUNT_NAV)}
      </nav>

      {!collapsed && (
        <div className="px-4 py-2">
          <p className="text-sm font-semibold text-sidebar-accent-foreground">
            MIA Inventory
          </p>
          <p className="text-xs text-sidebar-foreground">
            PT Indonesia Epson Industry
          </p>
        </div>
      )}

      <div className="border-t border-sidebar-border p-2">
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
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
    </aside>
  );
}
