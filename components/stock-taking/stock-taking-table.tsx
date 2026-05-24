"use client";

import { AlertTriangle, CheckCircle2, ClipboardList } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
} from "react";
import { TypeBadge } from "@/components/shared/type-badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PartWithStock } from "@/lib/types";

export interface StockTakingTableRow {
  part: PartWithStock;
  actualRaw: string;
  actual: number | null;
  diff: number | null;
}

interface StockTakingTableProps {
  rows: StockTakingTableRow[];
  onActualChange: (partId: string, value: string) => void;
  startIndex: number;
}

/** Sticky-header audit table with keyboard nav between Actual Stock inputs. */
export function StockTakingTable({
  rows,
  onActualChange,
  startIndex,
}: StockTakingTableProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  // Resize the refs array when the visible rows change (e.g. filter applied).
  useEffect(() => {
    inputs.current = inputs.current.slice(0, rows.length);
  }, [rows.length]);

  const moveFocus = useCallback(
    (from: number, delta: 1 | -1) => {
      const next = from + delta;
      if (next < 0 || next >= rows.length) return;
      inputs.current[next]?.focus();
      inputs.current[next]?.select();
    },
    [rows.length],
  );

  const handleKey = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      moveFocus(index, 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveFocus(index, -1);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-14 text-sm text-muted-foreground">
        <ClipboardList className="h-7 w-7 opacity-40" />
        <p className="font-medium">Tidak ada part yang cocok</p>
        <p className="text-xs">
          Coba ubah filter atau cari dengan kata kunci yang berbeda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div className="max-h-[640px] overflow-y-auto">
        <Table className="text-sm [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3">
          <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
            <TableRow>
              {[
                { label: "No", className: "w-12" },
                { label: "Part" },
                { label: "Maker" },
                { label: "Type" },
                { label: "Storage" },
                { label: "Current", className: "text-right" },
                { label: "Unit" },
                { label: "Actual Stock", className: "w-[140px] text-center" },
                { label: "Diff", className: "text-center" },
                { label: "Status", className: "text-center" },
              ].map((c) => (
                <TableHead
                  key={c.label}
                  className={cn(
                    "h-11 whitespace-nowrap text-xs font-medium text-muted-foreground",
                    c.className,
                  )}
                >
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const { part: p, actualRaw, diff } = r;
              const audited = diff !== null;
              const ok = audited && diff === 0;
              const ng = audited && diff !== 0;
              return (
                <TableRow
                  key={p.id}
                  className={cn(
                    "whitespace-nowrap transition-colors",
                    ok && "bg-chart-2/5",
                    ng && "bg-chart-3/5",
                  )}
                >
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {startIndex + i + 1}
                  </TableCell>
                  <TableCell>
                    <div className="leading-tight">
                      <p className="font-medium">{p.partName}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {p.partCode}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.maker}</TableCell>
                  <TableCell>
                    <TypeBadge type={p.type} />
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">
                    {p.storageAddr}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold tabular-nums">
                    {p.currentStock}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.unit}
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      ref={(el) => {
                        inputs.current[i] = el;
                      }}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={actualRaw}
                      onChange={(e) => onActualChange(p.id, e.target.value)}
                      onKeyDown={(e) => handleKey(e, i)}
                      placeholder="—"
                      className={cn(
                        "mx-auto h-9 w-24 text-center text-sm font-semibold tabular-nums",
                        ng &&
                          "border-chart-3/60 focus-visible:ring-chart-3/30",
                        ok &&
                          "border-chart-2/60 focus-visible:ring-chart-2/30",
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {diff === null ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          diff === 0
                            ? "text-chart-2"
                            : diff > 0
                              ? "text-chart-1"
                              : "text-chart-3",
                        )}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {diff === null ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : diff === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-chart-2/30 bg-chart-2/15 px-2 py-0.5 text-xs font-semibold text-chart-2">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-chart-3/30 bg-chart-3/15 px-2 py-0.5 text-xs font-semibold text-chart-3">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        NG
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
