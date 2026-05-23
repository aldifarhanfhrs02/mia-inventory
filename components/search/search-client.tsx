"use client";

import { ChevronDown, ChevronRight, FileUp, Loader2 } from "lucide-react";
import { Fragment, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { searchParts } from "@/lib/actions/search.actions";
import type {
  SearchInputRow,
  SearchMatchStatus,
  SearchResult,
  SearchSummary,
} from "@/lib/types";

const STATUS: Record<
  SearchMatchStatus,
  {
    label: string;
    icon: string;
    variant: React.ComponentProps<typeof Badge>["variant"];
    rowClass: string;
  }
> = {
  exact: {
    label: "Exact Match",
    icon: "✅",
    variant: "success",
    rowClass: "bg-chart-2/5",
  },
  possible: {
    label: "Possible",
    icon: "🟡",
    variant: "warning",
    rowClass: "bg-chart-3/5",
  },
  not_found: {
    label: "Not Found",
    icon: "❌",
    variant: "destructive",
    rowClass: "bg-destructive/5",
  },
  shortage: {
    label: "Shortage",
    icon: "🔵",
    variant: "info",
    rowClass: "bg-chart-1/5",
  },
};

/** Pull a value from a parsed row by any of several candidate header names. */
function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const k of Object.keys(row)) {
    if (keys.some((c) => k.toLowerCase().replace(/[\s_]/g, "").includes(c))) {
      return String(row[k] ?? "").trim();
    }
  }
  return "";
}

/** Part Search — upload a file, match rows against the active parts pool. */
export function SearchClient() {
  const [phase, setPhase] = useState<"empty" | "processing" | "results">(
    "empty",
  );
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [summary, setSummary] = useState<SearchSummary | null>(null);
  const [filter, setFilter] = useState<SearchMatchStatus | "all">("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Format tidak didukung — gunakan .xlsx, .xls, atau .csv");
      return;
    }
    setPhase("processing");
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      const rows: SearchInputRow[] = json.slice(0, 500).map((r, i) => ({
        row: i + 1,
        partCode: pick(r, ["partcode", "code", "kode"]),
        partName: pick(r, ["partname", "name", "nama"]),
        maker: pick(r, ["maker", "brand", "merk"]),
        qtyNeeded: Number(pick(r, ["qty", "jumlah", "quantity"])) || 0,
      }));
      if (rows.length === 0) {
        toast.error("File kosong atau format kolom tidak dikenali");
        setPhase("empty");
        return;
      }
      const res = await searchParts(file.name, rows);
      if (res.ok) {
        setResults(res.data.results);
        setSummary(res.data.summary);
        setFilter("all");
        setExpanded(null);
        setPhase("results");
      } else {
        toast.error(res.error);
        setPhase("empty");
      }
    } catch {
      toast.error("Gagal membaca file");
      setPhase("empty");
    }
  };

  if (phase === "processing") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-semibold">Memproses file…</p>
        <p className="text-sm text-muted-foreground">
          Mencocokkan part dengan database
        </p>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed py-20 transition-colors",
            dragOver ? "border-primary bg-primary/5" : "hover:bg-accent/40",
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <FileUp className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">
            Drop file Excel atau klik untuk browse
          </p>
          <p className="text-sm text-muted-foreground">
            Format: .xlsx / .xls / .csv — Maks 500 baris
          </p>
        </div>
      </div>
    );
  }

  const visible =
    filter === "all" ? results : results.filter((r) => r.status === filter);

  const badge = (key: SearchMatchStatus | "all", label: string, n: number) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
        filter === key
          ? "border-primary bg-primary/10 text-primary"
          : "hover:bg-accent",
      )}
    >
      {label} <span className="tabular-nums font-semibold">{n}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
        <p className="text-sm">
          <span className="font-medium">{fileName}</span>{" "}
          <span className="text-muted-foreground">
            · {results.length} baris
          </span>
        </p>
        <Button variant="outline" size="sm" onClick={() => setPhase("empty")}>
          Ganti File
        </Button>
      </div>

      {summary && (
        <div className="flex flex-wrap gap-2">
          {badge("all", "Total", summary.total)}
          {badge("exact", "✅ Exact", summary.exact)}
          {badge("possible", "🟡 Possible", summary.possible)}
          {badge("not_found", "❌ Not Found", summary.notFound)}
          {badge("shortage", "🔵 Shortage", summary.shortage)}
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead />
              <TableHead>Part Code</TableHead>
              <TableHead>Part Name (Input)</TableHead>
              <TableHead>Maker</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Matched Part</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => {
              const st = STATUS[r.status];
              const isOpen = expanded === r.row;
              return (
                <Fragment key={r.row}>
                  <TableRow
                    className={cn("cursor-pointer", st.rowClass)}
                    onClick={() => setExpanded(isOpen ? null : r.row)}
                  >
                    <TableCell className="text-muted-foreground">
                      {r.row}
                    </TableCell>
                    <TableCell>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums text-xs">
                      {r.partCode || "—"}
                    </TableCell>
                    <TableCell>{r.partName || "—"}</TableCell>
                    <TableCell>{r.maker || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.qtyNeeded}
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>
                        {st.icon} {st.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.matchedPart?.partName ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.matchedPart?.currentStock ?? "—"}
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className={st.rowClass}>
                      <TableCell colSpan={9} className="text-sm">
                        <p className="mb-2 text-muted-foreground">{r.note}</p>
                        {r.candidates.length > 0 && (
                          <div className="space-y-1">
                            {r.candidates.map((c) => (
                              <div
                                key={c.id}
                                className="flex justify-between rounded-md border bg-background p-2"
                              >
                                <span>
                                  {c.partName}{" "}
                                  <span className="tabular-nums text-xs text-muted-foreground">
                                    {c.partCode}
                                  </span>
                                </span>
                                <span className="tabular-nums">
                                  Stok {c.currentStock} {c.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {r.matchedPart && (
                          <div className="rounded-md border bg-background p-2 tabular-nums text-xs">
                            {r.matchedPart.partCode} · {r.matchedPart.storageAddr}{" "}
                            · Stok {r.matchedPart.currentStock}{" "}
                            {r.matchedPart.unit}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
