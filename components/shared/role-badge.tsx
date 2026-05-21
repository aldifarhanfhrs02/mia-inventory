import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const MAP: Record<UserRole, { label: string; className: string }> = {
  superadmin: {
    label: "Super Admin",
    className: "bg-primary/15 text-primary",
  },
  admin: {
    label: "Admin",
    className: "bg-chart-1/15 text-chart-1",
  },
  user: {
    label: "User",
    className: "bg-muted text-muted-foreground",
  },
};

/** User-role pill used in User Management and the Account page. */
export function RoleBadge({ role }: { role: UserRole }) {
  const m = MAP[role] ?? MAP.user;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold",
        m.className,
      )}
    >
      {m.label}
    </span>
  );
}
