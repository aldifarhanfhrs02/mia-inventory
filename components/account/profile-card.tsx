import { RoleBadge } from "@/components/shared/role-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UserRole, UserStatus } from "@/lib/types";

interface ProfileCardProps {
  nik: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  className?: string;
}

/** A label/value pair used inside the identity grid. */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

/** Identity card on the Profil tab — header band with avatar + info grid. */
export function ProfileCard({
  nik,
  fullName,
  role,
  status,
  className,
}: ProfileCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-center gap-4 border-b bg-muted/30 p-6">
        <UserAvatar size="xl" fullName={fullName} role={role} />
        <div className="min-w-0 space-y-1.5">
          <p className="truncate text-xl font-semibold leading-tight text-foreground">
            {fullName}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge role={role} />
            <Badge variant={status === "active" ? "success" : "secondary"}>
              {status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-xs tabular-nums text-muted-foreground">
            Employee ID · {nik}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-6 sm:grid-cols-2">
        <InfoRow label="Employee ID">
          <span className="tabular-nums">{nik}</span>
        </InfoRow>
        <InfoRow label="Full Name">{fullName}</InfoRow>
        <InfoRow label="Role">
          <RoleBadge role={role} />
        </InfoRow>
        <InfoRow label="Status">
          <Badge variant={status === "active" ? "success" : "secondary"}>
            {status === "active" ? "Active" : "Inactive"}
          </Badge>
        </InfoRow>
      </div>
    </Card>
  );
}
