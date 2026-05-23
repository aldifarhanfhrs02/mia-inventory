"use client";

import { CheckCircle2, FileSpreadsheet, Search, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { TypeBadge } from "@/components/shared/type-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PartWithStock } from "@/lib/types";

/** Stock Taking audit sheet — enter actual stock, see discrepancy vs system. */
export function StockTakingClient({ rows }: { rows: PartWithStock[] }) {
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [storage, setStorage] = useState("all");

  const storageOptions = useMemo(() => {
    const groups = new Set<string>();
    for (const p of rows) {
      if (p.storageType && p.storageNumber != null)
        groups.add(`${p.storageType}-${p.storageNumber}`);
    }
    return [...groups].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (storage !== "all") {
      list =
        storage.length === 1
          ? list.filter((p) => p.storageType === storage)
          : list.filter(
              (p) => `${p.storageType}-${p.storageNumber}` === storage,
            );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        [p.partName, p.partCode, p.maker, p.storageAddr]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [rows, storage, search]);

  const discrepancyOf = (p: PartWithStock): number | null => {
    const raw = actuals[p.id];
    if (raw === undefined || raw.trim() === "") return null;
    return Number(raw) - p.currentStock;
  };

  const summary = useMemo(() => {
    let filledCount = 0;
    let ok = 0;
    let ng = 0;
    for (const p of rows) {
      const d = (() => {
        const raw = actuals[p.id];
        if (raw === undefined || raw.trim() === "") return null;
        return Number(raw) - p.currentStock;
      })();
      if (d === null) continue;
      filledCount++;
      if (d === 0) ok++;
      else ng++;
    }
    return {
      total: rows.length,
      filled: filledCount,
      ok,
      ng,
      remaining: rows.length - filledCount,
    };
  }, [rows, actuals]);

  const exportCsv = () => {
    const headers = [
      "Part Name",
      "Maker",
      "Part Code",
      "Storage",
      "Type",
      "Current Stock",
      "Unit",
      "Actual Stock",
      "Discrepancy",
      "Status",
    ];
    const lines = filtered.map((p) => {
      const d = discrepancyOf(p);
      const actual = actuals[p.id]?.trim() ?? "";
      return [
        p.partName,
        p.maker,
        p.partCode,
        p.storageAddr,
        p.type,
        p.currentStock,
        p.unit,
        actual,
        d ?? "",
        d === null ? "" : d === 0 ? "OK" : "NG",
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = "﻿" + [headers.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Stock_Taking_${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stat = (label: string, value: number, className?: string) => (
    <span>
      <span className="text-muted-foreground">{label} </span>
      <span className={cn("tabular-nums font-semibold", className)}>{value}</span>
    </span>
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card p-3 text-sm">
        {stat("Total Part", summary.total)}
        {stat("Sudah Diaudit", summary.filled)}
        {stat("OK", summary.ok, "text-chart-2")}
        {stat("NG", summary.ng, "text-chart-4")}
        {stat("Belum Diaudit", summary.remaining, "text-muted-foreground")}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kode, maker, lokasi…"
            className="pl-8"
          />
        </div>
        <Select value={storage} onValueChange={setStorage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Lokasi</SelectItem>
            {storageOptions.map((g) => (
              <SelectItem key={g} value={g}>
                Group {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Part Name</TableHead>
              <TableHead>Maker</TableHead>
              <TableHead>Part Code</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-center">Actual Stock</TableHead>
              <TableHead className="text-center">Discrepancy</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada part yang cocok.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p, i) => {
              const d = discrepancyOf(p);
              const audited = d !== null;
              return (
                <TableRow
                  key={p.id}
                  className={cn(
                    audited && d === 0 && "bg-chart-2/5",
                    audited && d !== 0 && "bg-destructive/5",
                  )}
                >
                  <TableCell className="text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{p.partName}</TableCell>
                  <TableCell>{p.maker}</TableCell>
                  <TableCell className="tabular-nums text-xs">
                    {p.partCode}
                  </TableCell>
                  <TableCell className="tabular-nums text-xs">
                    {p.storageAddr}
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={p.type} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.currentStock}
                  </TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      value={actuals[p.id] ?? ""}
                      onChange={(e) =>
                        setActuals((a) => ({ ...a, [p.id]: e.target.value }))
                      }
                      className="mx-auto h-8 w-20 text-center tabular-nums"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {d === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Badge
                        variant={
                          d === 0 ? "success" : d > 0 ? "info" : "destructive"
                        }
                      >
                        {d > 0 ? `+${d}` : d}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {d === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : d === 0 ? (
                      <span className="inline-flex items-center gap-1 text-chart-2">
                        <CheckCircle2 className="h-4 w-4" /> OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-chart-4">
                        <XCircle className="h-4 w-4" /> NG
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
