"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StockHealthItem } from "@/lib/types";

/** Donut of stock-health buckets. Hovering a segment dims the rest and shows
 *  its name / value / share in the center — matches the design prototype. */
export function StockHealthChart({ data }: { data: StockHealthItem[] }) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const hovered = active !== null ? data[active] : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Stock Health</CardTitle>
        <p className="text-xs text-muted-foreground">Part Stock Condition</p>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto h-[210px] w-full max-w-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={64}
                outerRadius={92}
                paddingAngle={2}
                stroke="none"
                onMouseEnter={(_, i) => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    fillOpacity={active === null || active === i ? 1 : 0.35}
                    className="cursor-pointer transition-opacity"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl font-semibold"
              style={{ color: hovered ? hovered.color : undefined }}
            >
              {hovered ? hovered.value : total}
            </span>
            <span className="text-xs text-muted-foreground">
              {hovered ? hovered.name : "Total Parts"}
            </span>
            {hovered && total > 0 && (
              <span
                className="text-xs font-semibold"
                style={{ color: hovered.color }}
              >
                {((hovered.value / total) * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {data.map((d, i) => (
            <div
              key={d.name}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "flex cursor-default items-center gap-2 text-sm transition-opacity",
                active !== null && active !== i && "opacity-45",
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color }}
              />
              <span className="truncate text-muted-foreground">{d.name}</span>
              <span className="ml-auto font-medium tabular-nums">
                {d.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
