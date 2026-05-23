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
    <Card className="flex flex-col h-full">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base">Stock Health</CardTitle>
        <p className="text-xs text-muted-foreground">Part Stock Condition</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-6">
        {/* Donut chart — centered */}
        <div className="relative mx-auto h-[200px] w-full max-w-[240px] flex-1 flex items-center justify-center">
          <div className="relative h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={88}
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
                className="text-3xl font-bold"
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
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {data.map((d, i) => (
            <div
              key={d.name}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "flex cursor-default items-center gap-1.5 text-xs transition-opacity",
                active !== null && active !== i && "opacity-45",
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color }}
              />
              <span className="text-muted-foreground">
                {d.name}
              </span>
              <span className="font-semibold tabular-nums ml-0.5">
                {d.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
