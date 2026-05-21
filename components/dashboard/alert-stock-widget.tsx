import { AlertTriangle, CircleDashed, XCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AlertSeverity, AlertStockItem } from "@/lib/types";

const SEV: Record<
  AlertSeverity,
  {
    label: string;
    Icon: LucideIcon;
    variant: React.ComponentProps<typeof Badge>["variant"];
    bar: string;
    rowClass: string;
  }
> = {
  empty: {
    label: "Empty",
    Icon: CircleDashed,
    variant: "info",
    bar: "bg-chart-1",
    rowClass: "border-l-border",
  },
  critical: {
    label: "Critical",
    Icon: XCircle,
    variant: "destructive",
    bar: "bg-chart-4",
    rowClass: "border-l-chart-4 bg-destructive/5",
  },
  low: {
    label: "Low",
    Icon: AlertTriangle,
    variant: "warning",
    bar: "bg-chart-3",
    rowClass: "border-l-chart-3",
  },
};

/** Scrollable list of parts that need attention (current stock below min). */
export function AlertStockWidget({ items }: { items: AlertStockItem[] }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">⚠ Alert Stok</CardTitle>
          <p className="text-xs text-muted-foreground">
            Part yang perlu perhatian
          </p>
        </div>
        <Badge variant="info">{items.length} item</Badge>
      </CardHeader>
      <div className="max-h-[370px] space-y-2 overflow-y-auto px-6 pb-6">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Semua stok dalam kondisi baik 🎉
          </p>
        )}
        {items.map((item) => {
          const sev = SEV[item.severity];
          const Icon = sev.Icon;
          const pct =
            item.minStock > 0
              ? Math.min((item.currentStock / item.minStock) * 100, 100)
              : 0;
          return (
            <Link
              key={item.id}
              href={`/parts?search=${encodeURIComponent(item.partCode)}`}
              className={cn(
                "block rounded-md border border-l-2 p-2.5 transition-colors hover:bg-accent/40",
                sev.rowClass,
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-sm font-medium">
                    {item.partName}
                  </span>
                </div>
                <Badge variant={sev.variant}>{sev.label}</Badge>
              </div>
              <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                {item.partCode}
              </div>
              <div className="mt-1 text-xs">
                Stok:{" "}
                <strong className="font-mono">{item.currentStock}</strong>
                <span className="text-muted-foreground">
                  /{item.minStock} min
                </span>
              </div>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn("block h-full rounded-full", sev.bar)}
                  style={{ width: `${pct}%` }}
                />
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
