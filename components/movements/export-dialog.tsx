"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";
import type { MovementRow } from "@/lib/actions/movements.actions";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: MovementRow[];
}

const HEADERS = [
  "Date",
  "Time",
  "Part Name",
  "Part Code",
  "Type",
  "Quantity",
  "Final Stock",
  "Requestor",
  "Inputer",
  "Project",
];

/** Export dialog — downloads the current movement rows as CSV. */
export function ExportDialog({ open, onOpenChange, rows }: ExportDialogProps) {
  const [format, setFormat] = useState<"xlsx" | "csv">("csv");

  const handleExport = () => {
    const lines = rows.map((m) => {
      const d = new Date(m.createdAt);
      return [
        formatDate(d),
        d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        m.partName,
        m.partCode,
        m.type,
        m.quantity,
        m.stockAfter,
        m.requestor,
        m.inputerName,
        m.project ?? "",
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    // BOM so Excel reads UTF-8 correctly.
    const csv = "﻿" + [HEADERS.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-movement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Export Stock Movement</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {rows.length} transaksi akan di-export.
        </p>
        <div className="flex gap-2">
          {(["csv", "xlsx"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={cn(
                "flex-1 rounded-md border py-1.5 text-sm",
                format === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              .{f}
            </button>
          ))}
        </div>
        {format === "xlsx" && (
          <p className="text-xs text-muted-foreground">
            Export .xlsx tersedia di fase berikutnya — file akan diunduh
            sebagai .csv (kompatibel dengan Excel).
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
