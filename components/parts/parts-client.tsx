"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pagination } from "@/components/shared/pagination";
import { getPartDetail } from "@/lib/actions/parts.actions";
import { getStorageHistory } from "@/lib/actions/purchase.actions";
import type { PartTableRow } from "@/lib/actions/parts.actions";
import { AssignLocationSheet } from "./assign-location-sheet";
import { EditPartSheet } from "./edit-part-sheet";
import { ExportDialog } from "./export-dialog";
import { ImportDialog } from "./import-dialog";
import { PartDetailSheet, type PartDetail } from "./part-detail-sheet";
import { PartFormSheet } from "./part-form-sheet";
import { PartsTable } from "./parts-table";
import { PartsToolbar } from "./parts-toolbar";
import { PurchasePartSheet } from "./purchase-part-sheet";
import { StockDetailDialog } from "./stock-detail-dialog";
import {
  StorageHistoryDialog,
  type StorageHistoryData,
} from "./storage-history-dialog";

interface PartsClientProps {
  rows: PartTableRow[];
  total: number;
  page: number;
  pageSize: number;
  isAdmin: boolean;
  makers: string[];
  categories: string[];
  usedBarcodes: string[];
  usedAddresses: string[];
}

/** Orchestrates the Master Part toolbar, table, pagination, and all sheets. */
export function PartsClient({
  rows,
  total,
  page,
  pageSize,
  isAdmin,
  makers,
  categories,
  usedBarcodes,
  usedAddresses,
}: PartsClientProps) {
  const [detail, setDetail] = useState<PartDetail | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editPart, setEditPart] = useState<PartTableRow | null>(null);
  const [assignPart, setAssignPart] = useState<PartTableRow | null>(null);
  const [purchasePart, setPurchasePart] = useState<PartTableRow | null>(null);
  const [stockPart, setStockPart] = useState<PartTableRow | null>(null);
  const [storageHistory, setStorageHistory] =
    useState<StorageHistoryData | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Detail + storage history are fetched in click handlers (events, not render).
  const openDetail = (part: PartTableRow) =>
    startTransition(async () => {
      const d = await getPartDetail(part.id);
      if (d) setDetail(d as PartDetail);
      else toast.error("Part tidak ditemukan");
    });

  const openStorageHistory = (addr: string) =>
    startTransition(async () => {
      const res = await getStorageHistory(addr);
      setStorageHistory({ addr, ...res });
    });

  return (
    <>
      <PartsToolbar
        isAdmin={isAdmin}
        makers={makers}
        categories={categories}
        onAdd={() => setAddOpen(true)}
        onImport={() => setImportOpen(true)}
        onExport={() => setExportOpen(true)}
      />

      <PartsTable
        data={rows}
        startIndex={(page - 1) * pageSize}
        isAdmin={isAdmin}
        onView={openDetail}
        onEdit={setEditPart}
        onAssign={setAssignPart}
        onPurchase={setPurchasePart}
        onStorageHistory={openStorageHistory}
        onStockClick={setStockPart}
      />

      <Pagination page={page} pageSize={pageSize} total={total} />

      <PartDetailSheet
        detail={detail}
        onOpenChange={(open) => !open && setDetail(null)}
      />
      <PartFormSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        usedBarcodes={usedBarcodes}
        usedAddresses={usedAddresses}
      />
      <EditPartSheet
        key={`edit-${editPart?.id ?? "none"}`}
        open={!!editPart}
        onOpenChange={(open) => !open && setEditPart(null)}
        part={editPart}
      />
      <AssignLocationSheet
        key={`assign-${assignPart?.id ?? "none"}`}
        open={!!assignPart}
        onOpenChange={(open) => !open && setAssignPart(null)}
        part={assignPart}
        usedBarcodes={usedBarcodes}
        usedAddresses={usedAddresses}
      />
      <PurchasePartSheet
        key={`purchase-${purchasePart?.id ?? "none"}`}
        open={!!purchasePart}
        onOpenChange={(open) => !open && setPurchasePart(null)}
        part={purchasePart}
      />
      <StockDetailDialog
        part={stockPart}
        onOpenChange={(open) => !open && setStockPart(null)}
      />
      <StorageHistoryDialog
        data={storageHistory}
        onOpenChange={(open) => !open && setStorageHistory(null)}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        rows={rows}
      />
    </>
  );
}
