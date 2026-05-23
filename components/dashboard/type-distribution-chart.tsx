"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

/** Custom horizontal stacked bar chart with gray background track and value labels. */
export function TypeDistributionChart({
  perType,
}: {
  perType: Record<PartType, TypeBreakdown>;
}) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

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

  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <Card className="relative flex flex-col h-full">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base">Distribution Type</CardTitle>
        <p className="text-xs text-muted-foreground">
          Number of parts per type category
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between pt-6">
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-5 py-2">
            {data.map((row, i) => {
              const barWidth = (row.total / maxVal) * 100;
              return (
                <div
                  key={row.type}
                  className="group flex items-center gap-3"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Label */}
                  <span
                    className={cn(
                      "w-[84px] shrink-0 text-[13px] text-muted-foreground transition-opacity",
                      hovered !== null && hovered !== i && "opacity-45",
                    )}
                  >
                    {row.type}
                  </span>

                  {/* Track — gray background + colored segments */}
                  <div className="relative flex-1">
                    {/* Full-width gray background track */}
                    <div className="h-[34px] w-full overflow-hidden rounded-md bg-muted-foreground/15" />

                    {/* Stacked color segments */}
                    <div
                      className="absolute inset-y-0 left-0 flex overflow-hidden rounded-md transition-all duration-700 ease-out"
                      style={{
                        width: mounted ? `${barWidth}%` : "0%",
                        transitionDelay: `${i * 120}ms`,
                      }}
                    >
                      {SEGMENTS.map((seg) => {
                        const segVal = row[seg.key];
                        if (segVal === 0) return null;
                        const segPct = (segVal / row.total) * 100;
                        return (
                          <div
                            key={seg.key}
                            className={cn(
                              "h-full transition-opacity",
                              hovered !== null && hovered !== i && "opacity-45",
                            )}
                            style={{
                              width: `${segPct}%`,
                              backgroundColor: seg.color,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Value label */}
                  <span
                    className={cn(
                      "w-[40px] shrink-0 text-right text-sm font-semibold tabular-nums transition-opacity",
                      hovered !== null && hovered !== i && "opacity-45",
                    )}
                  >
                    {row.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tooltip on hover */}
        {hovered !== null && (
          <div className="absolute bottom-[48px] left-6 right-6 rounded-md border bg-popover p-2.5 text-xs shadow-md z-10 pointer-events-none">
            <p className="mb-1 font-semibold">
              {data[hovered].type} — {data[hovered].total} parts
            </p>
            <div className="space-y-0.5">
              {SEGMENTS.map((s) => {
                const v = data[hovered][s.key];
                const pct =
                  data[hovered].total > 0
                    ? Math.round((v / data[hovered].total) * 100)
                    : 0;
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
        )}

        {/* Legend */}
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
