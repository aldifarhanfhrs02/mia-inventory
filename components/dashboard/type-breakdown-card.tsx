import { Cog, Hammer, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PartType, TypeBreakdown } from "@/lib/types";

const META: Record<
  PartType,
  { label: string; Icon: LucideIcon; headerClass: string }
> = {
  electrical: {
    label: "Electrical",
    Icon: Zap,
    headerClass: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  },
  mechanical: {
    label: "Mechanical",
    Icon: Cog,
    headerClass: "bg-purple-500/15 text-purple-600 dark:text-purple-300",
  },
  fabrication: {
    label: "Fabrication",
    Icon: Hammer,
    headerClass: "bg-teal-500/15 text-teal-600 dark:text-teal-300",
  },
};

const ROWS = [
  { key: "available", label: "Available", color: "bg-chart-2" },
  { key: "lowStock", label: "Low Stock", color: "bg-chart-3" },
  { key: "outOfStock", label: "Out of Stock", color: "bg-chart-4" },
  { key: "unassigned", label: "Unassigned", color: "bg-chart-5" },
] as const;

/** Per-type breakdown card with mini progress bars. Rows link to Master Part. */
export function TypeBreakdownCard({ data }: { data: TypeBreakdown }) {
  const meta = META[data.type];
  const Icon = meta.Icon;
  return (
    <Card className="overflow-hidden p-0">
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2.5",
          meta.headerClass,
        )}
      >
        <div className="flex items-center">
          <span className="font-semibold">{meta.label}</span>
        </div>
        <span className="font-mono text-xs font-semibold">
          {data.total} parts
        </span>
      </div>
      <div className="space-y-2.5 p-4">
        {ROWS.map((r) => {
          const val = data[r.key];
          const pct = data.total > 0 ? (val / data.total) * 100 : 0;
          return (
            <Link
              key={r.key}
              href={`/parts?type=${data.type}&status=${r.key === "lowStock" ? "low_stock" : r.key === "outOfStock" ? "out_of_stock" : r.key}`}
              className="flex items-center gap-2.5 text-sm hover:opacity-80"
            >
              <span className={cn("h-2 w-2 rounded-full", r.color)} />
              <span className="w-24 shrink-0 text-muted-foreground">
                {r.label}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn("block h-full rounded-full", r.color)}
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-6 text-right font-medium tabular-nums">
                {val}
              </span>
            </Link>
          );
        })}
        <div className="border-t pt-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Asset</span>
            <span
              className="text-muted-foreground"
              title="Akan tersedia di versi mendatang"
            >
              —
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
