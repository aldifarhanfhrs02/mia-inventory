"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useAssetsVisible } from "@/lib/hooks/use-assets-visible";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format";
import type { PartType, TypeBreakdown } from "@/lib/types";

const TYPE_LABEL: Record<PartType, string> = {
  Electrical: "Electrical",
  Mechanical: "Mechanical",
  Fabrication: "Fabrication",
};

/** Thin colored top-border so each card still reads as a distinct type. */
const TYPE_ACCENT: Record<PartType, string> = {
  Electrical: "border-t-blue-500",
  Mechanical: "border-t-purple-500",
  Fabrication: "border-t-teal-500",
};

/** Four stat cells per card — Available / Low / Out / Unassigned. */
const STATS = [
  {
    key: "available",
    short: "Available",
    full: "Available",
    accent: "bg-chart-2",
    filter: "available",
  },
  {
    key: "lowStock",
    short: "Low",
    full: "Low Stock",
    accent: "bg-chart-3",
    filter: "low_stock",
  },
  {
    key: "outOfStock",
    short: "Out",
    full: "Out of Stock",
    accent: "bg-chart-4",
    filter: "out_of_stock",
  },
  {
    key: "unassigned",
    short: "Unassigned",
    full: "Unassigned",
    accent: "bg-slate-400",
    filter: "unassigned",
  },
] as const;

/**
 * Per-type breakdown card — clean 4-stat row, no decorative progress bars.
 * Each stat is a Link to the Master Part page pre-filtered to its segment.
 */
export function TypeBreakdownCard({ data }: { data: TypeBreakdown }) {
  const { visible, mounted } = useAssetsVisible();
  const assetLabel =
    data.totalAsset == null
      ? "—"
      : visible || !mounted
        ? formatPrice(data.totalAsset)
        : "Rp •••";

  return (
    <Card
      className={cn(
        "overflow-hidden border-t-[3px]",
        TYPE_ACCENT[data.type],
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold">{TYPE_LABEL[data.type]}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {data.total} parts
        </span>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-4 border-y bg-muted/20">
        {STATS.map((s, i) => {
          const value = data[s.key];
          return (
            <Link
              key={s.key}
              href={`/parts?type=${data.type}&status=${s.filter}`}
              title={`${s.full} — ${value} part`}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-3 transition-colors hover:bg-accent/40",
                i < STATS.length - 1 && "border-r",
              )}
            >
              <span className="text-xl font-semibold tabular-nums text-foreground">
                {value}
              </span>
              <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {s.short}
              </span>
              <span
                className={cn("mt-0.5 h-[2px] w-6 rounded-full", s.accent)}
              />
            </Link>
          );
        })}
      </div>

      {/* Footer — Total Asset */}
      <div className="flex items-center justify-between px-4 py-2.5 text-xs">
        <span className="text-muted-foreground">Total Asset</span>
        <span
          className={cn(
            "font-semibold tabular-nums text-foreground",
            !visible && mounted && "tracking-widest text-muted-foreground",
          )}
        >
          {assetLabel}
        </span>
      </div>
    </Card>
  );
}
