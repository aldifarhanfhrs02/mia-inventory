"use client";

import { useState } from "react";
import { Pagination } from "@/components/shared/pagination";
import type {
  MovementRow,
  MovementSummary,
} from "@/lib/actions/movements.actions";
import { ExportDialog } from "./export-dialog";
import { MovementsTable } from "./movements-table";
import { MovementsToolbar } from "./movements-toolbar";
import { StockDialog } from "./stock-dialog";

interface MovementsClientProps {
  rows: MovementRow[];
  total: number;
  page: number;
  pageSize: number;
  isAdmin: boolean;
  projectOptions: string[];
  inputerLabel: string;
  summary: MovementSummary;
}

/** Orchestrates the Stock Movement toolbar, table, sheet, and export dialog. */
export function MovementsClient({
  rows,
  total,
  page,
  pageSize,
  isAdmin,
  projectOptions,
  inputerLabel,
  summary,
}: MovementsClientProps) {
  const [sheetMode, setSheetMode] = useState<"IN" | "OUT" | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <>
      <MovementsToolbar
        isAdmin={isAdmin}
        onStockIn={() => setSheetMode("IN")}
        onStockOut={() => setSheetMode("OUT")}
        onExport={() => setExportOpen(true)}
        total={total}
        summary={summary}
      />

      <MovementsTable rows={rows} startIndex={(page - 1) * pageSize} />

      <Pagination page={page} pageSize={pageSize} total={total} />

      {/* key remounts the dialog so its form state resets on each open. */}
      <StockDialog
        key={sheetMode ?? "closed"}
        mode={sheetMode}
        onOpenChange={(open) => !open && setSheetMode(null)}
        projectOptions={projectOptions}
        inputerLabel={inputerLabel}
      />
      <ExportDialog
        key={`export-${exportOpen ? "open" : "closed"}`}
        open={exportOpen}
        onOpenChange={setExportOpen}
        rows={rows}
      />
    </>
  );
}
