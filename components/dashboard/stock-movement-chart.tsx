"use client";

import { ArrowDownCircle, ArrowUpCircle, Inbox } from "lucide-react";
import { useState } from "react";
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
import type { MovementTrend, MovementTrendPoint } from "@/lib/types";

type Period = "daily" | "weekly" | "monthly";
type Metric = "qty" | "count";

const PERIODS: { key: Period; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const METRICS: { key: Metric; label: string }[] = [
  { key: "qty", label: "Quantity" },
  { key: "count", label: "Count" },
];

/** Recharts grouped column chart — Stock IN vs Stock OUT over time. */
export function StockMovementChart({ trend }: { trend: MovementTrend }) {
  const [period, setPeriod] = useState<Period>("daily");
  const [metric, setMetric] = useState<Metric>("count");

  const points = trend[period];
  const data = points.map((p) => ({
    label: p.label,
    in: metric === "qty" ? p.in.qty : p.in.count,
    out: metric === "qty" ? p.out.qty : p.out.count,
  }));

  const totalIn = points.reduce(
    (s, p) => s + (metric === "qty" ? p.in.qty : p.in.count),
    0,
  );
  const totalOut = points.reduce(
    (s, p) => s + (metric === "qty" ? p.out.qty : p.out.count),
    0,
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Stock Movement</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              IN vs OUT {metric === "qty" ? "(unit)" : "(transaksi)"} ·{" "}
              {period === "daily"
                ? "7 hari terakhir"
                : period === "weekly"
                  ? "8 minggu terakhir"
                  : "6 bulan terakhir"}
            </p>
          </div>
          <Segmented
            options={METRICS}
            value={metric}
            onChange={setMetric}
            className="shrink-0"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs">
            <Legend
              icon={ArrowUpCircle}
              label="IN"
              value={totalIn}
              className="text-chart-2"
            />
            <Legend
              icon={ArrowDownCircle}
              label="OUT"
              value={totalOut}
              className="text-chart-4"
            />
          </div>
          <Segmented options={PERIODS} value={period} onChange={setPeriod} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="relative">
          {totalIn === 0 && totalOut === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 text-center">
              <Inbox className="h-7 w-7 text-muted-foreground/40" />
              <p className="text-xs font-medium text-muted-foreground">
                Belum ada transaksi Stock IN / OUT
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                Ganti periode atau catat transaksi via Stock Movement.
              </p>
            </div>
          )}
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
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
              content={<MovementTooltip metric={metric} points={points} />}
            />
            <Bar
              dataKey="in"
              name="Stock IN"
              fill="hsl(var(--chart-2))"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="out"
              name="Stock OUT"
              fill="hsl(var(--chart-4))"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/** Small segmented control — 2 or 3 pills. */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border bg-muted/40 p-0.5 text-xs",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded px-2 py-1 font-medium transition-colors",
            value === o.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Inline color-dot label with running total. */
function Legend({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">
        {value.toLocaleString("id-ID")}
      </span>
    </span>
  );
}

/** Custom tooltip — shows IN/OUT with qty + count for the hovered bucket. */
function MovementTooltip({
  active,
  payload,
  label,
  metric,
  points,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
  metric: Metric;
  points: MovementTrendPoint[];
}) {
  if (!active || !payload?.length) return null;
  const point = points.find((p) => p.label === label);
  if (!point) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-semibold">{label}</p>
      <div className="space-y-0.5">
        <p className="flex items-center justify-between gap-3 text-chart-2">
          <span>↑ Stock IN</span>
          <span className="font-semibold tabular-nums">
            {(metric === "qty" ? point.in.qty : point.in.count).toLocaleString(
              "id-ID",
            )}
            <span className="ml-1 text-muted-foreground">
              {metric === "qty" ? "unit" : "trx"}
            </span>
          </span>
        </p>
        <p className="flex items-center justify-between gap-3 text-chart-4">
          <span>↓ Stock OUT</span>
          <span className="font-semibold tabular-nums">
            {(metric === "qty"
              ? point.out.qty
              : point.out.count
            ).toLocaleString("id-ID")}
            <span className="ml-1 text-muted-foreground">
              {metric === "qty" ? "unit" : "trx"}
            </span>
          </span>
        </p>
      </div>
    </div>
  );
}
