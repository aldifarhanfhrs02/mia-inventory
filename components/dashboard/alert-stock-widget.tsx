import {
  AlertTriangle,
  ChevronRight,
  CircleDashed,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AlertSeverity, AlertStockItem } from "@/lib/types";

const SEV: Record<
  AlertSeverity,
  { label: string; Icon: LucideIcon; iconClass: string; badgeClass: string }
> = {
  empty: {
    label: "Empty",
    Icon: CircleDashed,
    iconClass: "bg-chart-1/15 text-chart-1",
    badgeClass: "bg-chart-1/15 text-chart-1",
  },
  critical: {
    label: "Critical",
    Icon: XCircle,
    iconClass: "bg-chart-4/15 text-chart-4",
    badgeClass: "bg-chart-4/15 text-chart-4",
  },
  low: {
    label: "Low",
    Icon: AlertTriangle,
    iconClass: "bg-chart-3/15 text-chart-3",
    badgeClass: "bg-chart-3/15 text-chart-3",
  },
};

/** Parts that need attention — list styled to match the Transaction Log card. */
export function AlertStockWidget({ items }: { items: AlertStockItem[] }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base">⚠ Alert Stok</CardTitle>
        <p className="text-xs text-muted-foreground">
          {items.length} part perlu perhatian
        </p>
      </CardHeader>

      <div className="flex-1 px-3 pt-3">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Semua stok dalam kondisi baik 🎉
          </p>
        )}
        {items.map((item, i) => {
          const sev = SEV[item.severity];
          const Icon = sev.Icon;
          return (
            <div key={item.id}>
              <Link
                href={`/parts?search=${encodeURIComponent(item.partCode)}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    sev.iconClass,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm">
                    <span className="truncate font-semibold text-foreground">
                      {item.partName}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold",
                        sev.badgeClass,
                      )}
                    >
                      {sev.label}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="tabular-nums">{item.partCode}</span>
                    {" · Stok "}
                    <span className="tabular-nums font-medium text-foreground">
                      {item.currentStock}
                    </span>
                    /{item.minStock} min
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
              {i < items.length - 1 && <div className="mx-3 border-t" />}
            </div>
          );
        })}
      </div>

      <div className="p-3 pt-2">
        <Link
          href="/parts?status=low_stock"
          className="block rounded-md py-2 text-center text-sm font-medium text-primary hover:bg-muted/60"
        >
          Lihat Semua →
        </Link>
      </div>
    </Card>
  );
}
