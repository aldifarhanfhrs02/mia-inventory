"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { TypeBadge } from "@/components/shared/type-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PartTableRow } from "@/lib/actions/parts.actions";

/**
 * Dialog opened from the Stock cell — shows the part's stock thresholds
 * (Min / Std / Max) and a current-stock progress bar with markers.
 */
export function StockDetailDialog({
  part,
  onOpenChange,
}: {
  part: PartTableRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const p = part;
  const max = p?.maxStock && p.maxStock > 0 ? p.maxStock : null;
  const fillPct = p && max ? Math.min((p.currentStock / max) * 100, 100) : 0;
  const minPct = p && max ? Math.min((p.minStock / max) * 100, 100) : 0;
  const stdPct =
    p && max && p.stdStock ? Math.min((p.stdStock / max) * 100, 100) : null;

  const fillColor =
    p && p.currentStock === 0
      ? "bg-chart-4"
      : p && p.currentStock < p.minStock
        ? "bg-chart-3"
        : "bg-chart-2";

  return (
    <Dialog open={!!p} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="tabular-nums text-xs text-muted-foreground">
              {p?.partCode}
            </span>
            {p && (
              <StatusBadge
                status={p.status === "inactive" ? "inactive" : p.stockStatus}
              />
            )}
          </div>
          <DialogTitle>{p?.partName}</DialogTitle>
          {p && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {p.maker} · <TypeBadge type={p.type} />
            </div>
          )}
        </DialogHeader>

        {p && (
          <div className="space-y-4">
            {/* Current stock */}
            <div className="rounded-lg border p-3">
              <div className="flex items-end justify-between">
                <span className="text-sm text-muted-foreground">
                  Current Stock
                </span>
                <span
                  className={cn(
                    "tabular-nums text-2xl font-bold",
                    p.currentStock === 0
                      ? "text-chart-4"
                      : p.currentStock < p.minStock
                        ? "text-chart-3"
                        : "text-foreground",
                  )}
                >
                  {p.currentStock}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {p.unit}
                  </span>
                </span>
              </div>

              {/* Bar with markers */}
              <div className="relative mt-3 h-2 rounded-full bg-muted">
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all",
                    fillColor,
                  )}
                  style={{ width: `${fillPct}%` }}
                />
                {max && (
                  <>
                    <span
                      className="absolute -top-1 h-4 w-px bg-chart-4"
                      style={{ left: `${minPct}%` }}
                      title={`Min ${p.minStock}`}
                    />
                    {stdPct !== null && (
                      <span
                        className="absolute -top-1 h-4 w-px bg-chart-1"
                        style={{ left: `${stdPct}%` }}
                        title={`Std ${p.stdStock}`}
                      />
                    )}
                  </>
                )}
              </div>
              <div className="mt-1 flex justify-between tabular-nums text-[10px] text-muted-foreground">
                <span>0</span>
                <span className="text-chart-2">
                  Max {p.maxStock ?? "—"}
                </span>
              </div>
            </div>

            {/* Threshold table */}
            <div className="grid grid-cols-3 gap-2">
              <Threshold label="Min" value={p.minStock} colorClass="text-chart-4" />
              <Threshold
                label="Std"
                value={p.stdStock}
                colorClass="text-chart-1"
              />
              <Threshold
                label="Max"
                value={p.maxStock}
                colorClass="text-chart-2"
              />
            </div>

            {p.currentStock < p.minStock && (
              <p className="rounded-md border border-chart-3/30 bg-chart-3/10 px-3 py-2 text-xs text-foreground">
                Stok berada di bawah <strong>Min ({p.minStock})</strong> —
                pertimbangkan untuk Purchase Part.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Threshold({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number | null;
  colorClass: string;
}) {
  return (
    <div className="rounded-md border p-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("tabular-nums text-base font-semibold", colorClass)}>
        {value ?? "—"}
      </p>
    </div>
  );
}
