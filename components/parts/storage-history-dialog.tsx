"use client";

import { Package, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StorageHistoryRow } from "@/lib/actions/purchase.actions";

export interface StorageHistoryData {
  addr: string;
  current: StorageHistoryRow | null;
  history: StorageHistoryRow[];
}

/**
 * Open a popup window with just the barcode + identifying info and trigger
 * the print dialog. The user can pick "Save as PDF" from the print sheet to
 * "save" the barcode — works on all browsers without extra deps.
 */
function printBarcode(barcode: string, addr: string, partName: string) {
  const w = window.open("", "_blank", "width=520,height=380");
  if (!w) return;
  w.document.write(`<!DOCTYPE html>
<html lang="id">
  <head>
    <title>Barcode ${barcode}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&family=Roboto+Mono:wght@500&display=swap"
    >
    <style>
      *{box-sizing:border-box}
      body{font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:32px 24px;margin:0;color:#111}
      .name{font-size:14px;font-weight:600;margin-bottom:2px}
      .addr{font-family:'Roboto Mono',monospace;font-size:13px;color:#666;margin-bottom:14px}
      .barcode{font-family:'Libre Barcode 39',monospace;font-size:96px;line-height:1;margin:0}
      .num{font-family:'Roboto Mono',monospace;font-size:18px;letter-spacing:6px;margin-top:6px}
      @media print{@page{size:auto;margin:8mm}}
    </style>
  </head>
  <body onload="setTimeout(()=>{window.print();},250)">
    <div class="name">${partName.replace(/</g, "&lt;")}</div>
    <div class="addr">${addr}</div>
    <div class="barcode">*${barcode}*</div>
    <div class="num">${barcode}</div>
    <script>window.onafterprint = () => window.close();</script>
  </body>
</html>`);
  w.document.close();
}

/** Storage detail dialog — current occupant, barcode label, usage history. */
export function StorageHistoryDialog({
  data,
  onOpenChange,
}: {
  data: StorageHistoryData | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!data} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Detail Storage
          </DialogTitle>
        </DialogHeader>
        {data && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-base font-bold tracking-wide text-primary">
                {data.addr}
              </span>
              <Badge variant={data.current ? "success" : "secondary"}>
                {data.current ? "In Use" : "Available"}
              </Badge>
            </div>

            {data.current && (
              <div className="rounded-md border p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  Saat ini digunakan oleh
                </p>
                <p className="text-sm font-medium">{data.current.partName}</p>
                <p className="tabular-nums text-xs text-muted-foreground">
                  {data.current.partCode}
                </p>
              </div>
            )}

            {/* Barcode label */}
            {data.current?.barcode && (
              <div className="rounded-md border bg-white p-4 text-center text-black dark:bg-zinc-100">
                <p className="text-xs font-semibold text-zinc-600">
                  Barcode (Code 39)
                </p>
                <p
                  className="mt-1 leading-none text-zinc-900"
                  style={{
                    fontFamily: "var(--font-barcode), monospace",
                    fontSize: "76px",
                  }}
                >
                  *{data.current.barcode}*
                </p>
                <p className="mt-1 tabular-nums text-base tracking-[0.4em] text-zinc-900">
                  {data.current.barcode}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() =>
                    printBarcode(
                      data.current!.barcode!,
                      data.addr,
                      data.current!.partName,
                    )
                  }
                >
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print / Save Barcode
                </Button>
                <p className="mt-1 text-[10px] text-zinc-500">
                  Choose <strong>Save as PDF</strong> in the print dialog to
                  save it.
                </p>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-sm font-semibold">History Penggunaan</p>
              {data.history.length === 0 ? (
                <p className="rounded-md border py-6 text-center text-sm text-muted-foreground">
                  No history for this storage yet.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Code</TableHead>
                        <TableHead>Part Name</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.history.map((h) => (
                        <TableRow key={h.partCode}>
                          <TableCell className="tabular-nums text-xs">
                            {h.partCode}
                          </TableCell>
                          <TableCell>{h.partName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                h.status === "active"
                                  ? "success"
                                  : "secondary"
                              }
                            >
                              {h.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Each storage can only be used by 1 active part. The part must be
              deactivated first before its location can be reused.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
