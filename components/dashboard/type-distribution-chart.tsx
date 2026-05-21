"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TypeDistributionItem } from "@/lib/types";

/** Horizontal bar of part count per type. */
export function TypeDistributionChart({
  data,
}: {
  data: TypeDistributionItem[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribution Type</CardTitle>
        <p className="text-xs text-muted-foreground">
          Number of parts per type category
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ left: 8, right: 24 }}
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
              <Bar dataKey="count" radius={[4, 4, 4, 4]} barSize={28}>
                {data.map((entry) => (
                  <Cell key={entry.type} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
