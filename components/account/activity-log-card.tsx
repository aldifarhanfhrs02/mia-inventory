import {
  ArrowUpDown,
  History,
  KeyRound,
  Package,
  ShieldCheck,
  Users as UsersIcon,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/format";
import type { ActivityRow } from "@/lib/actions/activity-logs.actions";
import type { ActivityAction } from "@/lib/types";

interface ActivityLogCardProps {
  rows: ActivityRow[];
}

interface Spec {
  label: string;
  Icon: LucideIcon;
  iconBg: string;
  iconClass: string;
}

const SPECS: Record<ActivityAction, Spec> = {
  // User management
  CREATE_USER: {
    label: "Created new user",
    Icon: UsersIcon,
    iconBg: "bg-chart-1/15",
    iconClass: "text-chart-1",
  },
  UPDATE_USER: {
    label: "Updated user data",
    Icon: UsersIcon,
    iconBg: "bg-chart-1/15",
    iconClass: "text-chart-1",
  },
  DEACTIVATE_USER: {
    label: "Deactivated user",
    Icon: UsersIcon,
    iconBg: "bg-chart-4/15",
    iconClass: "text-chart-4",
  },
  RESET_PASSWORD: {
    label: "Reset user password",
    Icon: KeyRound,
    iconBg: "bg-chart-3/15",
    iconClass: "text-chart-3",
  },
  CHANGE_ROLE: {
    label: "Changed user role",
    Icon: ShieldCheck,
    iconBg: "bg-primary/15",
    iconClass: "text-primary",
  },
  CHANGE_PASSWORD: {
    label: "Changed password",
    Icon: KeyRound,
    iconBg: "bg-chart-3/15",
    iconClass: "text-chart-3",
  },
  // Stock movement
  STOCK_IN: {
    label: "Recorded stock IN",
    Icon: ArrowUpDown,
    iconBg: "bg-chart-2/15",
    iconClass: "text-chart-2",
  },
  STOCK_OUT: {
    label: "Recorded stock OUT",
    Icon: ArrowUpDown,
    iconBg: "bg-chart-4/15",
    iconClass: "text-chart-4",
  },
  ASSIGN_LOCATION: {
    label: "Assigned part location",
    Icon: Package,
    iconBg: "bg-chart-1/15",
    iconClass: "text-chart-1",
  },
  RELOCATE: {
    label: "Relocated part",
    Icon: Package,
    iconBg: "bg-chart-1/15",
    iconClass: "text-chart-1",
  },
  // Generic part lifecycle
  CREATE: {
    label: "Created new data",
    Icon: Package,
    iconBg: "bg-chart-1/15",
    iconClass: "text-chart-1",
  },
  UPDATE: {
    label: "Updated data",
    Icon: Package,
    iconBg: "bg-muted",
    iconClass: "text-muted-foreground",
  },
  DELETE: {
    label: "Deleted data",
    Icon: Package,
    iconBg: "bg-chart-4/15",
    iconClass: "text-chart-4",
  },
  DEACTIVATE: {
    label: "Deactivated",
    Icon: Package,
    iconBg: "bg-chart-4/15",
    iconClass: "text-chart-4",
  },
  REACTIVATE: {
    label: "Reactivated",
    Icon: Package,
    iconBg: "bg-chart-2/15",
    iconClass: "text-chart-2",
  },
  IMPORT: {
    label: "Imported data",
    Icon: Package,
    iconBg: "bg-chart-1/15",
    iconClass: "text-chart-1",
  },
  // Purchase
  CREATE_PURCHASE: {
    label: "Created purchase",
    Icon: Wallet,
    iconBg: "bg-primary/15",
    iconClass: "text-primary",
  },
  UPDATE_PURCHASE: {
    label: "Updated purchase",
    Icon: Wallet,
    iconBg: "bg-primary/15",
    iconClass: "text-primary",
  },
};

/** Last 10 activity-log entries authored by the current user. */
export function ActivityLogCard({ rows }: ActivityLogCardProps) {
  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-md bg-chart-1/15 p-1.5 text-chart-1">
            <History className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Your 10 most recent actions in the application.
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
            <div className="rounded-full bg-chart-1/15 p-3 text-chart-1">
              <History className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No activity yet
            </p>
            <p className="text-xs">
              Your activity will appear here after any data changes.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((row) => {
              const spec = SPECS[row.action] ?? {
                label: row.action,
                Icon: Package,
                iconBg: "bg-muted",
                iconClass: "text-muted-foreground",
              };
              return (
                <li
                  key={row.id}
                  className="flex items-center gap-3 py-3"
                >
                  <div className={cn("rounded-md p-2", spec.iconBg)}>
                    <spec.Icon className={cn("h-4 w-4", spec.iconClass)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {spec.label}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.entityType}
                      {row.entityId && (
                        <span className="ml-1 tabular-nums">
                          · {row.entityId.slice(0, 8)}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(row.createdAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
