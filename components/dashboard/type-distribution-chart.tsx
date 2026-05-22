"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PartType, TypeBreakdown } from "@/lib/types";

const SEGMENTS = [
  { key: "available", label: "Available", color: "hsl(var(--chart-2))" },
  { key: "lowStock", label: "Low Stock", color: "hsl(var(--chart-3))" },
  { key: "outOfStock", label: "Out of Stock", color: "hsl(var(--chart-4))" },
  { key: "unassigned", label: "Unassigned", color: "hsl(var(--chart-5))" },
] as const;

const TYPE_LABEL: Record<PartType, string> = {
  electrical: "Electrical",
  mechanical: "Mechanical",
  fabrication: "Fabrication",
};

interface Row {
  type: string;
  total: number;
  available: number;
  lowStock: number;
  outOfStock: number;
  unassigned: number;
}

/** Custom tooltip — per-status count + share for the hovered type. */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover p-2 text-xs shadow-md">
      <p className="mb-1 font-semibold">
        {row.type} — {row.total} parts
      </p>
      <div className="space-y-0.5">
        {SEGMENTS.map((s) => {
          const v = row[s.key];
          const pct = row.total > 0 ? Math.round((v / row.total) * 100) : 0;
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="ml-auto font-mono font-medium">
                {v} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Stacked horizontal bar — part count per type, segmented by stock status. */
export function TypeDistributionChart({
  perType,
}: {
  perType: Record<PartType, TypeBreakdown>;
}) {
  const data: Row[] = (
    ["electrical", "mechanical", "fabrication"] as PartType[]
  ).map((t) => ({
    type: TYPE_LABEL[t],
    total: perType[t].total,
    available: perType[t].available,
    lowStock: perType[t].lowStock,
    outOfStock: perType[t].outOfStock,
    unassigned: perType[t].unassigned,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribution Type</CardTitle>
        <p className="text-xs text-muted-foreground">
          Number of parts per type category
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="type"
                width={84}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 13, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                content={<ChartTooltip />}
              />
              {SEGMENTS.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="a"
                  fill={s.color}
                  barSize={26}
                  radius={
                    i === 0
                      ? [4, 0, 0, 4]
                      : i === SEGMENTS.length - 1
                        ? [0, 4, 4, 0]
                        : 0
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {SEGMENTS.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-muted-foreground">{s.label}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
