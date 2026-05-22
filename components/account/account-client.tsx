"use client";

import { ChevronRight, KeyRound } from "lucide-react";
import { useState } from "react";
import { RoleBadge } from "@/components/shared/role-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { UserRole, UserStatus } from "@/lib/types";
import { ChangePasswordForm } from "./change-password-form";

interface AccountClientProps {
  nik: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
}

/** Account page — profile view with a toggle to the change-password form. */
export function AccountClient(props: AccountClientProps) {
  const [view, setView] = useState<"profile" | "password">("profile");

  if (view === "password") {
    return <ChangePasswordForm onBack={() => setView("profile")} />;
  }

  const rows: [string, React.ReactNode][] = [
    ["NIK", <span key="n" className="font-mono">{props.nik}</span>],
    ["Nama Lengkap", props.fullName],
    ["Role", <RoleBadge key="r" role={props.role} />],
    [
      "Status",
      <Badge key="s" variant={props.status === "active" ? "success" : "secondary"}>
        {props.status === "active" ? "Active" : "Inactive"}
      </Badge>,
    ],
    [
      "Login Terakhir",
      <span key="l" className="font-mono text-xs">
        {formatDateTime(props.lastLoginAt)}
      </span>,
    ],
    [
      "Terdaftar Sejak",
      <span key="c" className="font-mono text-xs">
        {formatDate(props.createdAt)}
      </span>,
    ],
  ];

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          {props.fullName.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="text-lg font-semibold">{props.fullName}</p>
          <RoleBadge role={props.role} />
        </div>
      </div>

      <div className="border-t pt-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between py-2 text-sm"
          >
            <span className="text-muted-foreground">{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setView("password")}
        className="flex w-full items-center gap-2 rounded-md border p-3 text-sm font-medium hover:bg-accent/40"
      >
        <KeyRound className="h-4 w-4" />
        Ganti Password
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
