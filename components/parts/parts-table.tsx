"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { TypeBadge } from "@/components/shared/type-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PartTableRow } from "@/lib/actions/parts.actions";
import type { PartClass } from "@/lib/types";
import { RowActions } from "./row-actions";

const PART_CLASS_LABEL: Record<PartClass, string> = {
  consumable: "Consumable",
  existing_project: "Existing Project",
  new_part: "New Part",
};

/**
 * Source pill colors — orange / rose / outline. Picked to be visually distinct
 * from Type (blue / purple / teal) and Status (green / yellow / red / slate / gray).
 */
const PART_CLASS_CLASS: Record<PartClass, string> = {
  consumable:
    "border border-zinc-300 bg-transparent text-zinc-700 dark:border-zinc-600 dark:text-zinc-300",
  existing_project:
    "border-transparent bg-orange-500/15 text-orange-600 dark:text-orange-400",
  new_part:
    "border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

interface PartsTableProps {
  data: PartTableRow[];
  startIndex: number;
  isAdmin: boolean;
  onView: (part: PartTableRow) => void;
  onEdit: (part: PartTableRow) => void;
  onAssign: (part: PartTableRow) => void;
  onPurchase: (part: PartTableRow) => void;
  onStorageHistory: (addr: string) => void;
  /** Stock cell click → opens the Min/Std/Max detail dialog. */
  onStockClick: (part: PartTableRow) => void;
}

/** Sortable column headers — key matches a PartTableRow field. */
const COLS: { key: string; label: string; sortable: boolean; align?: "right" }[] =
  [
    { key: "_no", label: "No", sortable: false },
    { key: "partName", label: "Part Name", sortable: true },
    { key: "partCode", label: "Part Code", sortable: true },
    { key: "maker", label: "Maker", sortable: true },
    { key: "type", label: "Type", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "partClass", label: "Source", sortable: true },
    { key: "storageAddr", label: "Storage", sortable: true },
    { key: "currentStock", label: "Stock", sortable: true, align: "right" },
    { key: "unit", label: "Unit", sortable: false },
    { key: "stockStatus", label: "Status", sortable: true },
    { key: "updatedByName", label: "Updated By", sortable: false },
    { key: "_actions", label: "", sortable: false },
  ];

/** Master Part table — sortable headers, color-coded stock, clickable cells. */
export function PartsTable({
  data,
  startIndex,
  isAdmin,
  onView,
  onEdit,
  onAssign,
  onPurchase,
  onStorageHistory,
  onStockClick,
}: PartsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "partName";
  const dir = searchParams.get("dir") === "desc" ? "desc" : "asc";

  const toggleSort = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", key);
    params.set("dir", sort === key && dir === "asc" ? "desc" : "asc");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table className="[&_td]:px-3 [&_td]:py-3 [&_th]:px-3">

        <TableHeader>
          <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
            {COLS.map((c) => (
              <TableHead
                key={c.key}
                onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                className={cn(
                  "h-11 whitespace-nowrap px-3 text-[12px] font-medium text-muted-foreground",
                  c.align === "right" && "text-right",
                  c.sortable && "cursor-pointer select-none hover:text-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {c.label}
                  {c.sortable && (
                    <span
                      className={cn(
                        "text-[10px] leading-none",
                        sort === c.key
                          ? "text-foreground"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {sort === c.key ? (dir === "asc" ? "▲" : "▼") : "⇅"}
                    </span>
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={COLS.length}
                className="h-24 text-center text-muted-foreground"
              >
                Tidak ada part yang cocok dengan filter.
              </TableCell>
            </TableRow>
          )}
          {data.map((p, i) => {
            const stockColor =
              p.currentStock === 0
                ? "text-chart-4"
                : p.currentStock < p.minStock
                  ? "text-chart-3"
                  : "text-foreground";
            return (
              <TableRow
                key={p.id}
                className={cn(
                  "whitespace-nowrap",
                  p.status === "unassigned" &&
                    "border-l-2 border-dashed border-l-slate-400 bg-slate-50 dark:border-l-slate-500 dark:bg-slate-800/20",
                  p.status === "inactive" && "opacity-55",
                )}
              >
                <TableCell className="text-muted-foreground">
                  {startIndex + i + 1}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onView(p)}
                    className="text-left font-medium text-primary hover:underline"
                  >
                    {p.partName}
                  </button>
                </TableCell>
                <TableCell className="tabular-nums text-xs">{p.partCode}</TableCell>
                <TableCell>{p.maker}</TableCell>
                <TableCell>
                  <TypeBadge type={p.type} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.category}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold",
                      PART_CLASS_CLASS[p.partClass],
                    )}
                  >
                    {PART_CLASS_LABEL[p.partClass]}
                  </span>
                </TableCell>
                <TableCell>
                  {p.storageAddr === "—" ? (
                    <span className="tabular-nums text-xs text-muted-foreground">
                      —
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStorageHistory(p.storageAddr)}
                      className="tabular-nums text-xs text-primary hover:underline"
                    >
                      {p.storageAddr}
                    </button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    onClick={() => onStockClick(p)}
                    title="Lihat Min / Std / Max"
                    className={cn(
                      "tabular-nums font-semibold hover:underline",
                      stockColor,
                    )}
                  >
                    {p.currentStock}
                  </button>
                </TableCell>
                <TableCell>{p.unit}</TableCell>
                <TableCell>
                  {p.status !== "inactive" &&
                  (p.stockStatus === "low_stock" ||
                    p.stockStatus === "out_of_stock") ? (
                    <button
                      type="button"
                      onClick={() => onPurchase(p)}
                      title="Klik untuk Purchase Part"
                    >
                      <StatusBadge status={p.stockStatus} />
                    </button>
                  ) : (
                    <StatusBadge
                      status={
                        p.status === "inactive" ? "inactive" : p.stockStatus
                      }
                    />
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.updatedByName.split(" ")[0]}
                </TableCell>
                <TableCell>
                  <RowActions
                    part={p}
                    isAdmin={isAdmin}
                    onView={onView}
                    onEdit={onEdit}
                    onAssign={onAssign}
                    onPurchase={onPurchase}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
