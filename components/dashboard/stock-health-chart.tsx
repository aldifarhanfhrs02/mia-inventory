"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StockHealthItem } from "@/lib/types";

/** Donut of stock-health buckets with the total in the center. */
export function StockHealthChart({ data }: { data: StockHealthItem[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Stock Health</CardTitle>
        <p className="text-xs text-muted-foreground">Part Stock Condition</p>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto h-[220px] w-full max-w-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={94}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-foreground">
              {total}
            </span>
            <span className="text-xs text-muted-foreground">Total Parts</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: d.color }}
              />
              <span className="text-muted-foreground">{d.name}</span>
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
