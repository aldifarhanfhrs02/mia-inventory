"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PartType, TypeBreakdown } from "@/lib/types";

const TYPE_LABEL: Record<PartType, string> = {
  Electrical: "Electrical",
  Mechanical: "Mechanical",
  Fabrication: "Fabrication",
};

const SEGMENTS = [
  {
    key: "available",
    label: "Available",
    color: "hsl(var(--chart-2))",
  },
  {
    key: "lowStock",
    label: "Low Stock",
    color: "hsl(var(--chart-3))",
  },
  {
    key: "outOfStock",
    label: "Out of Stock",
    color: "hsl(var(--chart-4))",
  },
  {
    key: "unassigned",
    label: "Unassigned",
    color: "hsl(var(--chart-5))",
  },
] as const;

/** Vertical stacked column chart — parts per type, stacked by stock status. */
export function TypeDistributionChart({
  perType,
}: {
  perType: Record<PartType, TypeBreakdown>;
}) {
  const data = (
    ["Electrical", "Mechanical", "Fabrication"] as PartType[]
  ).map((t) => {
    const b = perType[t];
    return {
      type: TYPE_LABEL[t],
      available: b.available,
      lowStock: b.lowStock,
      outOfStock: b.outOfStock,
      unassigned: b.unassigned,
      total: b.total,
    };
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base">Type Distribution</CardTitle>
        <p className="text-xs text-muted-foreground">
          Sebaran part per Type berdasarkan status stok.
        </p>
      </CardHeader>
      <CardContent className="flex-1 pt-5">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="type"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--accent) / 0.4)" }}
              content={<DistributionTooltip />}
            />
            {SEGMENTS.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="status"
                fill={s.color}
                maxBarSize={56}
                radius={
                  i === SEGMENTS.length - 1
                    ? [4, 4, 0, 0]
                    : [0, 0, 0, 0]
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {SEGMENTS.map((s) => (
            <span
              key={s.key}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full")}
                style={{ background: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Custom tooltip — sums + per-segment breakdown for the hovered type. */
function DistributionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 flex items-center justify-between gap-3 font-semibold">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {total} part
        </span>
      </p>
      <div className="space-y-0.5">
        {[...payload].reverse().map((p) => (
          <p
            key={p.dataKey}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: p.color }}
              />
              <span className="text-muted-foreground">{p.name}</span>
            </span>
            <span className="font-semibold tabular-nums">{p.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
