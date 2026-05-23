"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Database,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
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
import { formatDate } from "@/lib/utils/format";
import type { MovementRow } from "@/lib/actions/movements.actions";
import type { MovementType } from "@/lib/types";

interface SourceMeta {
  label: string;
  shortLabel: string;
  Icon: LucideIcon;
  /** Pill text + soft fill. */
  pillClass: string;
  /** Quantity color (text). */
  qtyClass: string;
  /** Row left-border accent. */
  borderClass: string;
  /** Sign in front of the quantity number. */
  sign: "+" | "−";
  /** Subtle row tint (light/dark). */
  tintClass: string;
}

/** Source/type meta — drives the table badge, qty color, and row accent. */
const SOURCE: Record<MovementType, SourceMeta> = {
  INITIAL: {
    label: "System — dibuat saat import Excel atau tambah part baru",
    shortLabel: "System",
    Icon: Database,
    pillClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/20",
    qtyClass: "text-sky-700 dark:text-sky-300",
    borderClass: "border-l-sky-500",
    sign: "+",
    tintClass: "hover:bg-sky-500/5",
  },
  IN: {
    label: "Manual Stock IN",
    shortLabel: "Manual IN",
    Icon: ArrowUpRight,
    pillClass:
      "bg-chart-2/15 text-chart-2 border border-chart-2/20",
    qtyClass: "text-chart-2",
    borderClass: "border-l-chart-2",
    sign: "+",
    tintClass: "hover:bg-chart-2/5",
  },
  OUT: {
    label: "Manual Stock OUT",
    shortLabel: "Stock OUT",
    Icon: ArrowDownRight,
    pillClass:
      "bg-chart-4/15 text-chart-4 border border-chart-4/20",
    qtyClass: "text-chart-4",
    borderClass: "border-l-chart-4",
    sign: "−",
    tintClass: "hover:bg-chart-4/5",
  },
};

/** Read-only Stock Movement table with source-aware row styling. */
export function MovementsTable({
  rows,
  startIndex,
}: {
  rows: MovementRow[];
  startIndex: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table className="[&_td]:px-3 [&_td]:py-3 [&_th]:px-3 text-sm">
        <TableHeader>
          <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
            {[
              { label: "No", className: "w-12" },
              { label: "Date / Time" },
              { label: "Source" },
              { label: "Part" },
              { label: "Type" },
              { label: "Quantity", className: "text-right" },
              { label: "Stock After", className: "text-right" },
              { label: "Requestor" },
              { label: "Inputer" },
              { label: "Project" },
            ].map((c) => (
              <TableHead
                key={c.label}
                className={cn(
                  "h-11 text-xs font-medium text-muted-foreground",
                  c.className,
                )}
              >
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="h-40 text-center">
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
                  <Inbox className="h-8 w-8 opacity-40" />
                  <p className="text-sm font-medium">
                    Tidak ada transaksi yang cocok
                  </p>
                  <p className="text-xs">
                    Coba ubah filter atau pilih rentang tanggal yang berbeda.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {rows.map((m, i) => {
            const meta = SOURCE[m.type];
            const Icon = meta.Icon;
            const d = new Date(m.createdAt);
            return (
              <TableRow
                key={m.id}
                className={cn(
                  "whitespace-nowrap border-l-2 transition-colors",
                  meta.borderClass,
                  meta.tintClass,
                )}
              >
                <TableCell className="text-xs text-muted-foreground">
                  {startIndex + i + 1}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col leading-tight">
                    <span className="tabular-nums text-xs text-foreground">
                      {formatDate(d)}
                    </span>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {d.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold",
                      meta.pillClass,
                    )}
                    title={meta.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {meta.shortLabel}
                  </span>
                </TableCell>
                <TableCell>
                  <Link
                    href="/parts"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {m.partName}
                  </Link>
                  <p className="tabular-nums text-xs text-muted-foreground">
                    {m.partCode}
                  </p>
                </TableCell>
                <TableCell>
                  <TypeBadge type={m.partType} />
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "tabular-nums text-sm font-semibold tabular-nums",
                      meta.qtyClass,
                    )}
                  >
                    {meta.sign}
                    {m.quantity}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {m.unit}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="tabular-nums text-sm font-semibold tabular-nums">
                    {m.stockAfter}
                  </span>
                  <span className="ml-1 tabular-nums text-xs text-muted-foreground">
                    ({m.stockBefore}→{m.stockAfter})
                  </span>
                </TableCell>
                <TableCell className="text-sm">{m.requestor}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {m.inputerName.split(" ")[0]}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {m.project ?? "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
