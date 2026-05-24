"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Info,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/lib/types";

type Scope = "tobuy" | "full";
type Format = "xlsx" | "csv";

const STATUS_LABEL: Record<SearchResult["status"], string> = {
  exact: "Sudah Tersedia",
  shortage: "Shortage",
  possible: "Kandidat",
  not_found: "Perlu Dibeli",
};

interface SearchExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: SearchResult[];
  fileName: string;
}

/** Export Part Search results — To-Buy Only (procurement) or Full Results (audit). */
export function SearchExportDialog({
  open,
  onOpenChange,
  results,
  fileName,
}: SearchExportDialogProps) {
  const [scope, setScope] = useState<Scope>("tobuy");
  const [format, setFormat] = useState<Format>("xlsx");
  const [busy, setBusy] = useState(false);

  const toBuyRows = useMemo(
    () =>
      results.filter(
        (r) => r.status === "shortage" || r.status === "not_found",
      ),
    [results],
  );

  const targetRows = scope === "tobuy" ? toBuyRows : results;

  /** Build a row object based on the selected scope. */
  const buildRow = (r: SearchResult): Record<string, unknown> => {
    if (scope === "tobuy") {
      const action =
        r.status === "shortage" && r.matchedPart
          ? `Beli ${r.qtyToBuy ?? r.qtyNeeded} dari ${r.qtyNeeded} (stok ${r.matchedPart.currentStock})`
          : `Beli ${r.qtyToBuy ?? r.qtyNeeded}`;
      return {
        "Row #": r.row,
        "Part Code": r.partCode,
        "Part Name": r.partName,
        Maker: r.maker,
        "Qty Needed": r.qtyNeeded,
        "Qty to Buy": r.qtyToBuy ?? r.qtyNeeded,
        "Existing Stock": r.matchedPart?.currentStock ?? 0,
        Unit: r.matchedPart?.unit ?? "",
        "Storage Address": r.matchedPart?.storageAddr ?? "",
        Status: STATUS_LABEL[r.status],
        "Suggested Action": action,
      };
    }
    return {
      "Row #": r.row,
      "Part Code": r.partCode,
      "Part Name": r.partName,
      Maker: r.maker,
      "Qty Needed": r.qtyNeeded,
      Status: STATUS_LABEL[r.status],
      "Matched Part Code": r.matchedPart?.partCode ?? "",
      "Matched Part Name": r.matchedPart?.partName ?? "",
      "Storage Address": r.matchedPart?.storageAddr ?? "",
      "Existing Stock": r.matchedPart?.currentStock ?? "",
      Unit: r.matchedPart?.unit ?? "",
      "Qty to Buy": r.qtyToBuy ?? "",
      Candidates: r.candidates.length,
      Note: r.note,
    };
  };

  const exportFile = () => {
    if (targetRows.length === 0) {
      toast.error("Tidak ada baris yang sesuai dengan scope ini");
      return;
    }
    setBusy(true);
    try {
      const data = targetRows.map(buildRow);
      const sheet = XLSX.utils.json_to_sheet(data);
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Part Search");
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const scopeTag = scope === "tobuy" ? "tobuy" : "full";
      XLSX.writeFile(book, `part-search-${scopeTag}-${stamp}.${format}`);
      toast.success(
        `${data.length} baris diekspor ke ${format.toUpperCase()}`,
      );
      onOpenChange(false);
    } catch {
      toast.error("Gagal membuat file export");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[95vw] max-w-2xl flex-col gap-0 p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* HEADER */}
        <DialogHeader className="border-b px-6 pb-4 pt-6 text-left">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Export Hasil Pencarian
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pilih cakupan dan format. To-Buy Only cocok untuk diteruskan ke
                tim procurement; Full Results untuk audit atau dokumentasi.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* Source file */}
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
              <Database className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Source:</span>
              <span className="font-medium text-foreground">{fileName}</span>
              <span className="ml-auto text-muted-foreground tabular-nums">
                {results.length} baris
              </span>
            </div>

            {/* SCOPE */}
            <section>
              <SectionHeader>Cakupan Data</SectionHeader>
              <div className="mt-2 space-y-2">
                <ScopeOption
                  active={scope === "tobuy"}
                  onClick={() => setScope("tobuy")}
                  title="To-Buy Only"
                  count={toBuyRows.length}
                  icon={ShoppingCart}
                  iconClass="text-chart-4"
                  recommended
                >
                  <p className="text-xs text-muted-foreground">
                    Hanya baris yang <strong>perlu dibeli</strong> (shortage +
                    not found), dengan kolom optimized untuk procurement:
                    Qty&nbsp;to&nbsp;Buy, stok yang sudah ada, dan saran
                    tindakan per baris.
                  </p>
                </ScopeOption>

                <ScopeOption
                  active={scope === "full"}
                  onClick={() => setScope("full")}
                  title="Full Results"
                  count={results.length}
                  icon={Database}
                  iconClass="text-primary"
                >
                  <p className="text-xs text-muted-foreground">
                    Semua baris dengan status pencocokan + detail part yang
                    di-match (jika ada). Cocok untuk laporan / audit trail
                    lengkap.
                  </p>
                </ScopeOption>
              </div>
            </section>

            {/* FORMAT */}
            <section>
              <SectionHeader>Format File</SectionHeader>
              <div className="mt-2 flex gap-2">
                {(["xlsx", "csv"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={cn(
                      "flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors",
                      format === f
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-accent/30",
                    )}
                  >
                    .{f}
                    <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                      {f === "xlsx" ? "Excel" : "Comma Separated"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* SUMMARY */}
            <section className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="text-xs">
                  <p className="font-semibold text-primary">
                    Akan diekspor:{" "}
                    <span className="tabular-nums">{targetRows.length}</span>{" "}
                    baris · scope:{" "}
                    {scope === "tobuy" ? "To-Buy Only" : "Full Results"} · .
                    {format}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    File akan diberi nama{" "}
                    <code className="rounded bg-background px-1">
                      part-search-{scope}-YYYYMMDD.{format}
                    </code>
                    .
                  </p>
                </div>
              </div>

              {scope === "tobuy" && toBuyRows.length === 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-chart-2/30 bg-chart-2/5 p-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-chart-2" />
                  <p className="text-xs text-foreground">
                    Tidak ada part yang perlu dibeli — semua sudah tersedia di
                    inventory.
                  </p>
                </div>
              )}
              {scope === "tobuy" && toBuyRows.length > 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-chart-3/30 bg-chart-3/5 p-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-chart-3" />
                  <p className="text-xs text-foreground">
                    Pastikan baris berstatus <strong>Kandidat</strong> sudah
                    direview manual — baris itu tidak termasuk dalam export ini.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center gap-2 border-t bg-muted/20 px-6 py-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <div className="flex-1" />
          <Button disabled={busy || targetRows.length === 0} onClick={exportFile}>
            {busy ? (
              <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            )}
            {busy ? "Mengekspor…" : `Export ${targetRows.length} Baris`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function ScopeOption({
  active,
  onClick,
  title,
  count,
  icon: Icon,
  iconClass,
  recommended,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
  recommended?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-accent/30",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          active
            ? "border-primary bg-primary"
            : "border-muted-foreground/40",
        )}
      >
        {active && (
          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
          <Icon className={cn("h-4 w-4", iconClass)} />
          {title}
          {recommended && (
            <span className="rounded-full bg-chart-2/15 px-1.5 py-0.5 text-[10px] font-semibold text-chart-2">
              Direkomendasikan
            </span>
          )}
          <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums">
            {count} baris
          </span>
        </div>
        {children}
      </div>
    </button>
  );
}
