"use client";

import { CalendarClock, Clock, Hourglass, type LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/format";

interface SessionInfoCardProps {
  issuedAt: number;
  expiresAt: number;
}

interface RowProps {
  Icon: LucideIcon;
  iconClass: string;
  iconBg: string;
  label: string;
  children: React.ReactNode;
}

function Row({ Icon, iconClass, iconBg, label, children }: RowProps) {
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

/** Format ms duration as "7 hours 23 minutes" / "23 minutes" / "< 1 minute". */
function humanizeRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return "< 1 minute";
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} ${mins === 1 ? "minute" : "minutes"}`;
  if (mins === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours} ${hours === 1 ? "hour" : "hours"} ${mins} ${mins === 1 ? "minute" : "minutes"}`;
}

/** External store that ticks every minute on the client; 0 on the server. */
function subscribeMinute(callback: () => void): () => void {
  const id = window.setInterval(callback, 60_000);
  return () => window.clearInterval(id);
}
const getNowClient = () => Date.now();
const getNowServer = () => 0;

/** Sesi Saat Ini — current cookie's lifetime and live remaining time. */
export function SessionInfoCard({ issuedAt, expiresAt }: SessionInfoCardProps) {
  // useSyncExternalStore avoids setState-in-effect; the server snapshot of 0
  // renders "—" for the live counter until hydration replaces it.
  const now = useSyncExternalStore(subscribeMinute, getNowClient, getNowServer);
  const remaining = now === 0 ? null : humanizeRemaining(expiresAt - now);

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-md bg-chart-1/15 p-1.5 text-chart-1">
            <Clock className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">Current Session</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Information about your login session on this device.
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <Row
          Icon={Clock}
          iconClass="text-chart-1"
          iconBg="bg-chart-1/15"
          label="Session Started"
        >
          <span className="tabular-nums">
            {formatDateTime(new Date(issuedAt))}
          </span>
        </Row>
        <Row
          Icon={CalendarClock}
          iconClass="text-chart-3"
          iconBg="bg-chart-3/15"
          label="Expires At"
        >
          <span className="tabular-nums">
            {formatDateTime(new Date(expiresAt))}
          </span>
        </Row>
        <Row
          Icon={Hourglass}
          iconClass="text-chart-2"
          iconBg="bg-chart-2/15"
          label="Time Remaining"
        >
          {remaining === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="tabular-nums">{remaining}</span>
          )}
        </Row>
        <p className="pt-3 text-[11px] text-muted-foreground">
          Session expires automatically after 8 hours of inactivity.
        </p>
      </CardContent>
    </Card>
  );
}
