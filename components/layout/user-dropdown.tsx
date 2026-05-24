"use client";

import { ChevronDown, Info, LogOut, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/components/shared/role-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { UserRole } from "@/lib/types";
import { AboutDialog } from "./about-dialog";

interface UserDropdownProps {
  user: { nik: string; fullName: string; role: UserRole };
}

/** Avatar + name button with an account / about / logout menu. */
export function UserDropdown({ user }: UserDropdownProps) {
  const router = useRouter();
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent/50">
        <UserAvatar
          size="sm"
          fullName={user.fullName}
          role={user.role}
          className="h-9 w-9 text-sm"
        />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight">
            {user.fullName}
          </span>
          <span className="block text-xs capitalize text-muted-foreground">
            {user.role}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2.5">
            <UserAvatar
              size="sm"
              fullName={user.fullName}
              role={user.role}
            />
            <div className="min-w-0">
              <div className="truncate font-semibold">{user.fullName}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="tabular-nums">{user.nik}</span>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <RoleBadge role={user.role} />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserCircle className="mr-2 h-4 w-4" />
            Akun Saya
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAboutOpen(true)}>
          <Info className="mr-2 h-4 w-4" />
          Tentang Aplikasi
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </DropdownMenu>
  );
}
