import {
  AlertTriangle,
  ChevronRight,
  CircleDashed,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AlertSeverity, AlertStockItem } from "@/lib/types";

interface SeverityMeta {
  label: string;
  Icon: LucideIcon;
  iconClass: string;
  pillClass: string;
}

const SEV: Record<AlertSeverity, SeverityMeta> = {
  empty: {
    label: "Empty",
    Icon: XCircle,
    iconClass: "bg-chart-4/15 text-chart-4",
    pillClass:
      "border border-chart-4/30 bg-chart-4/15 text-chart-4",
  },
  critical: {
    label: "Critical",
    Icon: AlertTriangle,
    iconClass: "bg-chart-4/10 text-chart-4",
    pillClass:
      "border border-chart-4/30 bg-chart-4/10 text-chart-4",
  },
  low: {
    label: "Low",
    Icon: CircleDashed,
    iconClass: "bg-chart-3/15 text-chart-3",
    pillClass:
      "border border-chart-3/30 bg-chart-3/15 text-chart-3",
  },
};

/** Sidebar widget — parts that need restocking attention. */
export function AlertStockWidget({ items }: { items: AlertStockItem[] }) {
  const counts = items.reduce(
    (acc, i) => {
      acc[i.severity]++;
      return acc;
    },
    { empty: 0, critical: 0, low: 0 } as Record<AlertSeverity, number>,
  );

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {/* Header — icon chip + title + subtitle + jump-to-all */}
      <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "rounded-md p-1.5",
              items.length === 0
                ? "bg-chart-2/15 text-chart-2"
                : "bg-chart-3/15 text-chart-3",
            )}
          >
            {items.length === 0 ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Alert Stok</h3>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Tidak ada part di bawah minimum
              </p>
            ) : (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                {counts.empty > 0 && (
                  <SubCount n={counts.empty} label="empty" color="text-chart-4" />
                )}
                {counts.critical > 0 && (
                  <SubCount
                    n={counts.critical}
                    label="critical"
                    color="text-chart-4"
                  />
                )}
                {counts.low > 0 && (
                  <SubCount n={counts.low} label="low" color="text-chart-3" />
                )}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/parts?status=low_stock,out_of_stock"
          className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
        >
          Lihat Semua
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Body */}
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
          <div className="rounded-full bg-chart-2/15 p-3 text-chart-2">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Semua stok aman
          </p>
          <p className="text-xs">
            Tidak ada part yang berada di bawah ambang batas minimum.
          </p>
        </div>
      ) : (
        <ul role="list" className="flex-1 divide-y">
          {items.map((item) => {
            const sev = SEV[item.severity];
            const Icon = sev.Icon;
            const pct =
              item.minStock > 0
                ? Math.min((item.currentStock / item.minStock) * 100, 100)
                : 0;
            return (
              <li key={item.id}>
                <Link
                  href={`/parts?search=${encodeURIComponent(item.partCode)}`}
                  className="block px-4 py-2.5 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        sev.iconClass,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.partName}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            sev.pillClass,
                          )}
                        >
                          {sev.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                        {item.partCode} · Stok{" "}
                        <span
                          className={cn(
                            "font-semibold",
                            item.currentStock === 0
                              ? "text-chart-4"
                              : "text-foreground",
                          )}
                        >
                          {item.currentStock}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}/ {item.minStock} min
                        </span>
                      </p>
                    </div>
                  </div>
                  {/* Tiny progress bar — current vs min */}
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        item.currentStock === 0
                          ? "bg-chart-4"
                          : item.severity === "critical"
                            ? "bg-chart-4/70"
                            : "bg-chart-3",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** Inline severity sub-count: "3 critical" with a leading dot. */
function SubCount({
  n,
  label,
  color,
}: {
  n: number;
  label: string;
  color: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", color.replace("text", "bg"))} />
      <span className="text-muted-foreground">
        <span className={cn("font-semibold tabular-nums", color)}>{n}</span>{" "}
        {label}
      </span>
    </span>
  );
}
