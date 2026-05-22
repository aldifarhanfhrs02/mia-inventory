"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PartTableRow } from "@/lib/actions/parts.actions";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rows currently shown (after filters) — exported as-is. */
  rows: PartTableRow[];
}

/** Export the current Master Part view to .xlsx or .csv. */
export function ExportDialog({ open, onOpenChange, rows }: ExportDialogProps) {
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");

  const exportFile = () => {
    const data = rows.map((p) => ({
      "Part Code": p.partCode,
      "Part Name": p.partName,
      Maker: p.maker,
      Type: p.type,
      Category: p.category,
      Storage: p.storageAddr,
      Barcode: p.barcode ?? "",
      Price: p.price ?? "",
      Stock: p.currentStock,
      Min: p.minStock,
      Std: p.stdStock ?? "",
      Max: p.maxStock ?? "",
      Unit: p.unit,
      Status: p.stockStatus,
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Master Part");
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    XLSX.writeFile(book, `master-parts-${stamp}.${format}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Export Master Part</DialogTitle>
          <DialogDescription>
            Export {rows.length} part (sesuai filter aktif) ke spreadsheet.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          {(["xlsx", "csv"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={cn(
                "flex-1 rounded-md border py-2 text-sm font-medium",
                format === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              .{f}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={exportFile}>
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
