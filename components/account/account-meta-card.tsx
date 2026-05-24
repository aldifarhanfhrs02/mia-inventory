import {
  CalendarDays,
  Clock,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { UserStatus } from "@/lib/types";

interface AccountMetaCardProps {
  lastLoginAt: Date | null;
  createdAt: Date;
  status: UserStatus;
}

interface RowProps {
  Icon: LucideIcon;
  iconClass: string;
  iconBg: string;
  label: string;
  children: React.ReactNode;
}

function MetaRow({ Icon, iconClass, iconBg, label, children }: RowProps) {
  return (
    <div className="flex items-center gap-3 border-b py-3 last:border-0">
      <div className={cn("rounded-md p-2", iconBg)}>
        <Icon className={cn("h-4 w-4", iconClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  );
}

/** Side card on the Profil tab — session/activity metadata. */
export function AccountMetaCard({
  lastLoginAt,
  createdAt,
  status,
}: AccountMetaCardProps) {
  const isActive = status === "active";
  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base">Account Activity</CardTitle>
        <p className="text-xs text-muted-foreground">
          Session and registration information for your account.
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <MetaRow
          Icon={Clock}
          iconClass="text-chart-1"
          iconBg="bg-chart-1/15"
          label="Last Login"
        >
          <span className="tabular-nums">{formatDateTime(lastLoginAt)}</span>
        </MetaRow>
        <MetaRow
          Icon={CalendarDays}
          iconClass="text-chart-2"
          iconBg="bg-chart-2/15"
          label="Registered Since"
        >
          <span className="tabular-nums">{formatDate(createdAt)}</span>
        </MetaRow>
        <MetaRow
          Icon={isActive ? ShieldCheck : ShieldAlert}
          iconClass={isActive ? "text-chart-2" : "text-chart-4"}
          iconBg={isActive ? "bg-chart-2/15" : "bg-chart-4/15"}
          label="Account Status"
        >
          <Badge variant={isActive ? "success" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </MetaRow>
      </CardContent>
    </Card>
  );
}
