"use client";

import {
  ArrowDown,
  ArrowUp,
  CalendarRange,
  FileSpreadsheet,
  Filter,
  Search,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MovementSummary } from "@/lib/actions/movements.actions";

interface MovementsToolbarProps {
  isAdmin: boolean;
  onStockIn: () => void;
  onStockOut: () => void;
  onExport: () => void;
  total: number;
  summary: MovementSummary;
}

const FILTER_KEYS = ["type", "partType", "dateFrom", "dateTo", "search"] as const;

/** Search, source filter, part-type, date range, summary strip, and actions. */
export function MovementsToolbar({
  isAdmin,
  onStockIn,
  onStockOut,
  onExport,
  total,
  summary,
}: MovementsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (search === current) return;
    const t = setTimeout(() => setParam("search", search.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const type = searchParams.get("type") ?? "all";
  const partType = searchParams.get("partType") ?? "all";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (type !== "all")
      chips.push({
        key: "type",
        label: `Source: ${
          type === "INITIAL"
            ? "System"
            : type === "IN"
              ? "Stock IN"
              : "Stock OUT"
        }`,
        onClear: () => setParam("type", "all"),
      });
    if (partType !== "all")
      chips.push({
        key: "partType",
        label: `Type: ${partType}`,
        onClear: () => setParam("partType", "all"),
      });
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, partType]);

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of FILTER_KEYS) params.delete(k);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    setSearch("");
  };

  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="mb-4 space-y-2">
      {/* ── ROW 1: Search · Source · Part Type · (right) Actions ───────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari part, NIK, requestor…"
            className="h-10 rounded-lg pl-9 text-sm"
          />
        </div>

        <Select value={type} onValueChange={(v) => setParam("type", v)}>
          <SelectTrigger
            className={cn(
              "h-10 w-[150px] rounded-lg text-sm",
              type !== "all" && "border-primary text-primary",
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="INITIAL">System</SelectItem>
            <SelectItem value="IN">Stock IN</SelectItem>
            <SelectItem value="OUT">Stock OUT</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={partType}
          onValueChange={(v) => setParam("partType", v)}
        >
          <SelectTrigger
            className={cn(
              "h-10 w-[150px] rounded-lg text-sm",
              partType !== "all" && "border-primary text-primary",
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Part Types</SelectItem>
            <SelectItem value="Electrical">Electrical</SelectItem>
            <SelectItem value="Mechanical">Mechanical</SelectItem>
            <SelectItem value="Fabrication">Fabrication</SelectItem>
          </SelectContent>
        </Select>

        {isAdmin && (
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-lg text-sm"
              onClick={onExport}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              Export
            </Button>
            <Button
              className="h-10 rounded-lg bg-chart-2 text-sm text-white shadow-sm hover:bg-chart-2/90"
              onClick={onStockIn}
            >
              <ArrowUp className="mr-1.5 h-4 w-4" />
              Stock IN
            </Button>
            <Button
              className="h-10 rounded-lg bg-chart-4 text-sm text-white shadow-sm hover:bg-chart-4/90"
              onClick={onStockOut}
            >
              <ArrowDown className="mr-1.5 h-4 w-4" />
              Stock OUT
            </Button>
          </div>
        )}
      </div>

      {/* ── ROW 2: Periode label + date inputs ──────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5" />
          Periode:
        </span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setParam("dateFrom", e.target.value)}
          className="h-9 w-[160px] rounded-lg tabular-nums text-xs"
        />
        <span className="text-xs text-muted-foreground">s/d</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setParam("dateTo", e.target.value)}
          className="h-9 w-[160px] rounded-lg tabular-nums text-xs"
        />
        {hasDateFilter && (
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("dateFrom");
              params.delete("dateTo");
              params.delete("page");
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Reset tanggal
          </button>
        )}
      </div>

      {/* ── ROW 3: Transaction summary strip ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border bg-card px-3 py-2 text-sm">
        <span className="text-muted-foreground">
          Total Transactions{" "}
          <span className="ml-0.5 font-semibold text-foreground tabular-nums">
            {total}
          </span>
        </span>
        <SummaryItem
          dotClass="bg-sky-500"
          label="System"
          count={summary.countInitial}
          qty={summary.qtyInitial}
          sign="+"
          color="text-sky-700 dark:text-sky-300"
        />
        <SummaryItem
          dotClass="bg-chart-2"
          label="IN"
          count={summary.countIn}
          qty={summary.qtyIn}
          sign="+"
          color="text-chart-2"
        />
        <SummaryItem
          dotClass="bg-chart-4"
          label="OUT"
          count={summary.countOut}
          qty={summary.qtyOut}
          sign="−"
          color="text-chart-4"
        />
      </div>

      {/* ── ROW 4: active filter chips (only when present) ──────────────── */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {activeChips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onClear}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/70"
            >
              {c.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="px-2 text-xs font-medium text-primary hover:underline"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

/** A single colored dot + count + signed quantity in the summary strip. */
function SummaryItem({
  dotClass,
  label,
  count,
  qty,
  sign,
  color,
}: {
  dotClass: string;
  label: string;
  count: number;
  qty: number;
  sign: "+" | "−";
  color: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", dotClass)} />
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular-nums", color)}>{count}</span>
      <span className={cn("text-xs tabular-nums", color)}>
        ({sign}
        {qty})
      </span>
    </span>
  );
}
