"use client";

import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

/** Read-only dialog showing who uses / has used a storage address. */
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
            Riwayat Storage
          </DialogTitle>
        </DialogHeader>
        {data && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold tracking-wide text-primary">
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
                <p className="font-mono text-xs text-muted-foreground">
                  {data.current.partCode}
                </p>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-sm font-semibold">History Penggunaan</p>
              {data.history.length === 0 ? (
                <p className="rounded-md border py-6 text-center text-sm text-muted-foreground">
                  Belum ada riwayat untuk storage ini.
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
                          <TableCell className="font-mono text-xs">
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
              Storage hanya bisa digunakan oleh 1 part aktif. Part harus
              dinonaktifkan dulu agar lokasi bisa dipakai part lain.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
