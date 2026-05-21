import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Pencil,
  Plus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityFeedItem } from "@/lib/types";

const META: Record<
  ActivityFeedItem["type"],
  { Icon: LucideIcon; iconClass: string }
> = {
  STOCK_IN: { Icon: ArrowUp, iconClass: "bg-chart-2/15 text-chart-2" },
  STOCK_OUT: { Icon: ArrowDown, iconClass: "bg-chart-4/15 text-chart-4" },
  UPDATE: { Icon: Pencil, iconClass: "bg-chart-1/15 text-chart-1" },
  CREATE: { Icon: Plus, iconClass: "bg-chart-5/15 text-chart-5" },
};

function describe(item: ActivityFeedItem) {
  const name = <span className="font-medium text-foreground">{item.partName}</span>;
  switch (item.type) {
    case "STOCK_IN":
      return (
        <>
          {" "}menambahkan stok {name}{" "}
          <span className="font-mono text-xs font-semibold text-chart-2">
            +{item.quantity}
          </span>
        </>
      );
    case "STOCK_OUT":
      return (
        <>
          {" "}mengambil {name}{" "}
          <span className="font-mono text-xs font-semibold text-chart-4">
            -{item.quantity}
          </span>
        </>
      );
    case "UPDATE":
      return <> mengedit {name}</>;
    case "CREATE":
      return <> menambahkan part {name}</>;
  }
}

/** Feed of the 10 most recent activity-log entries. */
export function TransactionLogFeed({ items }: { items: ActivityFeedItem[] }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Log Transaksi</CardTitle>
        <p className="text-xs text-muted-foreground">10 aktivitas terbaru</p>
      </CardHeader>
      <div className="flex-1 px-6">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada aktivitas.
          </p>
        )}
        {items.map((item, i) => {
          const m = META[item.type];
          const Icon = m.Icon;
          return (
            <div key={item.id}>
              <Link
                href="/movements"
                className="flex items-center gap-3 py-2.5 transition-colors hover:opacity-80"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    m.iconClass,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {item.userName.split(" ")[0]}
                    </span>
                    {describe(item)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.date}, {item.time}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </Link>
              {i < items.length - 1 && <div className="border-t" />}
            </div>
          );
        })}
      </div>
      <div className="p-4 pt-2">
        <Link
          href="/movements"
          className="block rounded-md border py-2 text-center text-sm font-medium text-primary hover:bg-accent/40"
        >
          Lihat Semua →
        </Link>
      </div>
    </Card>
  );
}
