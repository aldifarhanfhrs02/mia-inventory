import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  Inbox,
  PackagePlus,
  SquarePen,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityFeedItem } from "@/lib/types";

interface ActivityMeta {
  Icon: LucideIcon;
  /** Tailwind classes for the leading icon chip. */
  iconClass: string;
  /** Short verb label rendered in mono text right after the user name. */
  verb: string;
}

const META: Record<ActivityFeedItem["type"], ActivityMeta> = {
  STOCK_IN: {
    Icon: ArrowDownToLine,
    iconClass: "bg-chart-2/15 text-chart-2",
    verb: "menambahkan stok",
  },
  STOCK_OUT: {
    Icon: ArrowUpFromLine,
    iconClass: "bg-chart-4/15 text-chart-4",
    verb: "mengambil stok",
  },
  UPDATE: {
    Icon: SquarePen,
    iconClass: "bg-chart-1/15 text-chart-1",
    verb: "mengedit part",
  },
  CREATE: {
    Icon: PackagePlus,
    iconClass: "bg-chart-5/15 text-chart-5",
    verb: "menambahkan part",
  },
};

/** Feed of the 10 most recent activity-log entries. Read-only card. */
export function TransactionLogFeed({ items }: { items: ActivityFeedItem[] }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {/* Header — icon chip + title + subtitle + jump-to-all */}
      <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-md bg-primary/10 p-1.5 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Log Transaksi</h3>
            <p className="text-xs text-muted-foreground">
              {items.length === 0
                ? "Belum ada aktivitas"
                : `${items.length} aktivitas terbaru`}
            </p>
          </div>
        </div>
        <Link
          href="/movements"
          className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
        >
          Lihat Semua
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Body */}
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
          <Inbox className="h-7 w-7 opacity-40" />
          <p className="text-sm font-medium">Belum ada aktivitas</p>
          <p className="text-xs">
            Transaksi yang dicatat akan muncul di sini.
          </p>
        </div>
      ) : (
        <ul role="list" className="flex-1 divide-y">
          {items.map((item) => {
            const m = META[item.type];
            const Icon = m.Icon;
            const isStock =
              item.type === "STOCK_IN" || item.type === "STOCK_OUT";
            return (
              <li key={item.id}>
                <Link
                  href="/movements"
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/40"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      m.iconClass,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-semibold text-foreground">
                        {item.userName.split(" ")[0]}
                      </span>{" "}
                      <span className="text-muted-foreground">{m.verb}</span>{" "}
                      <span className="font-medium text-foreground">
                        {item.partName}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      {item.date} · {item.time}
                    </p>
                  </div>
                  {isStock && (
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                        item.type === "STOCK_IN"
                          ? "bg-chart-2/15 text-chart-2"
                          : "bg-chart-4/15 text-chart-4",
                      )}
                    >
                      {item.type === "STOCK_IN" ? "+" : "−"}
                      {item.quantity}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
