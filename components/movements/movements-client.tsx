"use client";

import { useState } from "react";
import { Pagination } from "@/components/shared/pagination";
import type { MovementRow } from "@/lib/actions/movements.actions";
import { ExportDialog } from "./export-dialog";
import { MovementsTable } from "./movements-table";
import { MovementsToolbar } from "./movements-toolbar";
import { StockSheet } from "./stock-sheet";

interface MovementsClientProps {
  rows: MovementRow[];
  total: number;
  page: number;
  pageSize: number;
  isAdmin: boolean;
  projectOptions: string[];
  inputerLabel: string;
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
      />

      <MovementsTable rows={rows} startIndex={(page - 1) * pageSize} />

      <Pagination page={page} pageSize={pageSize} total={total} />

      {/* key remounts the sheet so its form state resets on each open. */}
      <StockSheet
        key={sheetMode ?? "closed"}
        mode={sheetMode}
        onOpenChange={(open) => !open && setSheetMode(null)}
        projectOptions={projectOptions}
        inputerLabel={inputerLabel}
      />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} rows={rows} />
    </>
  );
}
