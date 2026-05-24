"use client";

import {
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { RoleBadge } from "@/components/shared/role-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import {
  resetPassword,
  setUserActive,
  updateUserRole,
} from "@/lib/actions/users.actions";
import type { UserListRow } from "@/lib/actions/users.actions";
import {
  ConfirmActionDialog,
  type ConfirmRequest,
} from "./confirm-action-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import {
  TempPasswordDialog,
  type TempPasswordPayload,
} from "./temp-password-dialog";
import { UserFormDialog } from "./user-form-dialog";

interface UsersClientProps {
  rows: UserListRow[];
  summary: { total: number; active: number; admin: number; inactive: number };
}

type RoleFilter = "all" | "admin" | "user";
type StatusFilter = "all" | "active" | "inactive";

/** Segmented-control button (mirror of the role toggle inside the add dialog). */
function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

export function UsersClient({ rows, summary }: UsersClientProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserListRow | null>(null);
  const [tempResult, setTempResult] = useState<TempPasswordPayload | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (q && !`${u.nik} ${u.fullName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, roleFilter, statusFilter]);

  const askReset = (u: UserListRow) =>
    setConfirm({
      kind: "reset-password",
      name: u.fullName,
      onConfirm: async () => {
        const res = await resetPassword(u.id);
        if (res.ok)
          setTempResult({
            title: `Password reset for ${u.fullName}`,
            password: res.data.tempPassword,
          });
        else toast.error(res.error);
      },
    });

  const askToggle = (u: UserListRow) => {
    const willActivate = u.status !== "active";
    setConfirm({
      kind: willActivate ? "activate" : "deactivate",
      name: u.fullName,
      onConfirm: async () => {
        const res = await setUserActive(u.id, willActivate);
        if (res.ok)
          toast.success(
            willActivate ? "User activated" : "User deactivated",
          );
        else toast.error(res.error);
      },
    });
  };

  const askRole = (u: UserListRow) => {
    const next = u.role === "admin" ? "user" : "admin";
    setConfirm({
      kind: next === "admin" ? "change-role-to-admin" : "change-role-to-user",
      name: u.fullName,
      onConfirm: async () => {
        const res = await updateUserRole(u.id, next);
        if (res.ok) toast.success(`Role changed to ${next}`);
        else toast.error(res.error);
      },
    });
  };

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (roleFilter !== "all")
    activeChips.push({
      key: "role",
      label: `Role: ${roleFilter === "admin" ? "Admin" : "User"}`,
      clear: () => setRoleFilter("all"),
    });
  if (statusFilter !== "all")
    activeChips.push({
      key: "status",
      label: `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`,
      clear: () => setStatusFilter("all"),
    });

  const clearAll = () => {
    setRoleFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* KPI grid — clicking a card applies its corresponding filter. */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          title="Total User"
          rawValue={summary.total}
          Icon={UsersIcon}
          accentClass="text-chart-1"
          borderClass="border-l-chart-1"
          iconBgClass="bg-chart-1/15"
          onClick={() => {
            setRoleFilter("all");
            setStatusFilter("all");
            setSearch("");
          }}
        />
        <KpiCard
          title="Active"
          rawValue={summary.active}
          Icon={UserCheck}
          accentClass="text-chart-2"
          borderClass="border-l-chart-2"
          iconBgClass="bg-chart-2/15"
          onClick={() => {
            setRoleFilter("all");
            setStatusFilter("active");
          }}
        />
        <KpiCard
          title="Admin"
          rawValue={summary.admin}
          Icon={ShieldCheck}
          accentClass="text-primary"
          borderClass="border-l-primary"
          iconBgClass="bg-primary/15"
          onClick={() => {
            setRoleFilter("admin");
            setStatusFilter("all");
          }}
        />
        <KpiCard
          title="Inactive"
          rawValue={summary.inactive}
          Icon={UserX}
          accentClass="text-chart-4"
          borderClass="border-l-chart-4"
          iconBgClass="bg-chart-4/15"
          onClick={() => {
            setRoleFilter("all");
            setStatusFilter("inactive");
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Employee ID or name…"
              className="h-10 rounded-lg pl-9"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1">
            <span className="px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Role
            </span>
            <SegButton
              active={roleFilter === "all"}
              onClick={() => setRoleFilter("all")}
            >
              All
            </SegButton>
            <SegButton
              active={roleFilter === "admin"}
              onClick={() => setRoleFilter("admin")}
            >
              Admin
            </SegButton>
            <SegButton
              active={roleFilter === "user"}
              onClick={() => setRoleFilter("user")}
            >
              User
            </SegButton>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1">
            <span className="px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </span>
            <SegButton
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            >
              All
            </SegButton>
            <SegButton
              active={statusFilter === "active"}
              onClick={() => setStatusFilter("active")}
            >
              Active
            </SegButton>
            <SegButton
              active={statusFilter === "inactive"}
              onClick={() => setStatusFilter("inactive")}
            >
              Inactive
            </SegButton>
          </div>

          <Button
            onClick={() => setAddOpen(true)}
            className="ml-auto h-10 rounded-lg px-4"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add User
          </Button>
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeChips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.clear}
                className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/70"
              >
                {c.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="px-2 text-xs font-medium text-primary hover:underline"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-card [&_td]:px-3 [&_td]:py-3 [&_th]:px-3">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-11 w-12 whitespace-nowrap text-xs font-medium text-muted-foreground">
                No
              </TableHead>
              <TableHead className="h-11 whitespace-nowrap text-xs font-medium text-muted-foreground">
                Employee ID
              </TableHead>
              <TableHead className="h-11 whitespace-nowrap text-xs font-medium text-muted-foreground">
                Full Name
              </TableHead>
              <TableHead className="h-11 whitespace-nowrap text-xs font-medium text-muted-foreground">
                Role
              </TableHead>
              <TableHead className="h-11 whitespace-nowrap text-xs font-medium text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="h-11 whitespace-nowrap text-xs font-medium text-muted-foreground">
                Last Login
              </TableHead>
              <TableHead className="h-11 whitespace-nowrap text-xs font-medium text-muted-foreground">
                Created
              </TableHead>
              <TableHead className="h-11 w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-muted-foreground">
                    <div className="rounded-full bg-muted p-3 text-muted-foreground">
                      <UsersIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      No matching users
                    </p>
                    <p className="text-xs">
                      Try changing your search keyword or filter above.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((u, i) => (
              <TableRow
                key={u.id}
                className={cn(u.status === "inactive" && "opacity-55")}
              >
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="text-xs tabular-nums">{u.nik}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      size="sm"
                      fullName={u.fullName}
                      role={u.role}
                    />
                    <span className="font-medium text-foreground">
                      {u.fullName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={u.role} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={u.status === "active" ? "success" : "secondary"}
                  >
                    {u.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs tabular-nums text-muted-foreground">
                  {formatDateTime(u.lastLoginAt)}
                </TableCell>
                <TableCell className="text-xs tabular-nums text-muted-foreground">
                  {formatDate(u.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="rounded-md p-1 hover:bg-accent"
                      aria-label="Actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setEditTarget(u)}>
                        Edit Name
                      </DropdownMenuItem>
                      {u.role !== "superadmin" && (
                        <DropdownMenuItem onClick={() => askRole(u)}>
                          Change Role (
                          {u.role === "admin" ? "→ User" : "→ Admin"})
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => askReset(u)}>
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className={cn(
                          u.status === "active" &&
                            "text-destructive focus:text-destructive",
                        )}
                        onClick={() => askToggle(u)}
                      >
                        {u.status === "active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={({ fullName, tempPassword }) =>
          setTempResult({
            title: `User ${fullName} dibuat`,
            password: tempPassword,
          })
        }
      />
      <TempPasswordDialog
        payload={tempResult}
        onClose={() => setTempResult(null)}
      />
      <ConfirmActionDialog
        request={confirm}
        onClose={() => setConfirm(null)}
      />
      <EditUserDialog
        user={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
}
