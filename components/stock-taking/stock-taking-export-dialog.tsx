"use client";

import {
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  Info,
  MapPin,
  RefreshCw,
  Tag,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PartWithStock } from "@/lib/types";

type Scope = "hasil" | "selisih" | "blank";
type Format = "xlsx" | "csv";

interface AuditRow {
  part: PartWithStock;
  /** Raw input value — "" when blank. */
  actualRaw: string;
  /** Parsed actual stock; null when the row was not filled in. */
  actual: number | null;
  /** actual − currentStock; null when not filled in. */
  diff: number | null;
}

interface ColumnGroup {
  key: "identity" | "location" | "stock" | "audit";
  label: string;
  description: string;
  icon: LucideIcon;
  required?: boolean;
  defaultOn: boolean;
}

const COLUMN_GROUPS: ColumnGroup[] = [
  {
    key: "identity",
    label: "Identitas",
    description: "No · Part Code · Part Name · Maker · Type · Unit",
    icon: Tag,
    required: true,
    defaultOn: true,
  },
  {
    key: "location",
    label: "Lokasi",
    description: "Storage Address · Barcode",
    icon: MapPin,
    defaultOn: true,
  },
  {
    key: "stock",
    label: "Stok",
    description: "Current Stock · Min · Std · Max",
    icon: TrendingUp,
    defaultOn: true,
  },
  {
    key: "audit",
    label: "Hasil Audit",
    description:
      "Actual Stock · Diff · Status · Audit Date · Auditor (kosong di Audit Sheet)",
    icon: ClipboardList,
    required: true,
    defaultOn: true,
  },
];

interface StockTakingExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Visible rows (filtered) — these define the export pool. */
  rows: AuditRow[];
  /** Logged-in user's display label, e.g. "Aldi Nugroho (ADM001)". */
  auditorLabel: string;
  /** Called when the user opts in to "Buang draft setelah export". */
  onDiscardDraft: () => void;
}

/** Smart export — Hasil Audit / Selisih Saja / Audit Sheet (Blank). */
export function StockTakingExportDialog({
  open,
  onOpenChange,
  rows,
  auditorLabel,
  onDiscardDraft,
}: StockTakingExportDialogProps) {
  const [scope, setScope] = useState<Scope>("hasil");
  const [format, setFormat] = useState<Format>("xlsx");
  const [cols, setCols] = useState<Set<ColumnGroup["key"]>>(
    () => new Set(COLUMN_GROUPS.filter((g) => g.defaultOn).map((g) => g.key)),
  );
  const [discardAfter, setDiscardAfter] = useState(false);
  const [busy, setBusy] = useState(false);

  const filledRows = useMemo(
    () => rows.filter((r) => r.actual !== null),
    [rows],
  );
  const ngRows = useMemo(
    () => rows.filter((r) => r.diff !== null && r.diff !== 0),
    [rows],
  );

  const scopeRows: AuditRow[] =
    scope === "hasil" ? filledRows : scope === "selisih" ? ngRows : rows;

  const toggleCol = (key: ColumnGroup["key"], required?: boolean) => {
    if (required) return;
    setCols((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const buildRow = (r: AuditRow, i: number): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    const p = r.part;
    if (cols.has("identity")) {
      out["No"] = i + 1;
      out["Part Code"] = p.partCode;
      out["Part Name"] = p.partName;
      out["Maker"] = p.maker;
      out["Type"] = p.type;
      out["Unit"] = p.unit;
    }
    if (cols.has("location")) {
      out["Storage Address"] = p.storageAddr === "—" ? "" : p.storageAddr;
      out["Barcode"] = p.barcode ?? "";
    }
    if (cols.has("stock")) {
      out["Current Stock"] = p.currentStock;
      out["Min Stock"] = p.minStock;
      out["Std Stock"] = p.stdStock ?? "";
      out["Max Stock"] = p.maxStock ?? "";
    }
    if (cols.has("audit")) {
      const isBlank = scope === "blank";
      out["Actual Stock"] = isBlank ? "" : (r.actual ?? "");
      out["Diff"] = isBlank ? "" : (r.diff ?? "");
      out["Status"] = isBlank
        ? ""
        : r.diff === null
          ? ""
          : r.diff === 0
            ? "OK"
            : "NG";
      out["Audit Date"] = isBlank
        ? ""
        : new Date().toISOString().slice(0, 10);
      out["Auditor"] = isBlank ? "" : auditorLabel;
    }
    return out;
  };

  const exportFile = () => {
    if (scopeRows.length === 0) {
      toast.error("Tidak ada baris yang sesuai dengan scope ini");
      return;
    }
    if (cols.size === 0) {
      toast.error("Pilih minimal satu grup kolom");
      return;
    }
    setBusy(true);
    try {
      const data = scopeRows.map(buildRow);
      const sheet = XLSX.utils.json_to_sheet(data);
      const book = XLSX.utils.book_new();
      const tab =
        scope === "hasil"
          ? "Hasil Audit"
          : scope === "selisih"
            ? "Selisih"
            : "Audit Sheet";
      XLSX.utils.book_append_sheet(book, sheet, tab);
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      XLSX.writeFile(book, `stock-taking-${scope}-${stamp}.${format}`);
      toast.success(
        `${data.length} baris diekspor ke ${format.toUpperCase()}`,
      );
      if (discardAfter && scope !== "blank") onDiscardDraft();
      onOpenChange(false);
    } catch {
      toast.error("Gagal membuat file export");
    } finally {
      setBusy(false);
    }
  };

  const scopeOptions: Array<{
    key: Scope;
    title: string;
    description: string;
    count: number;
    icon: LucideIcon;
    iconClass: string;
    recommended?: boolean;
  }> = [
    {
      key: "hasil",
      title: "Hasil Audit",
      description:
        "Hanya baris yang sudah dihitung (kolom Actual Stock terisi). Ini adalah laporan audit utama.",
      count: filledRows.length,
      icon: CheckCircle2,
      iconClass: "text-chart-2",
      recommended: true,
    },
    {
      key: "selisih",
      title: "Selisih Saja (NG)",
      description:
        "Hanya baris dengan selisih ≠ 0. Shortlist untuk admin yang akan membuat reconciliation movement.",
      count: ngRows.length,
      icon: XCircle,
      iconClass: "text-chart-3",
    },
    {
      key: "blank",
      title: "Audit Sheet (Blank)",
      description:
        "Semua baris terlihat, dengan kolom Actual / Diff / Status dikosongkan — bagus untuk dicetak dan dibawa keliling gudang.",
      count: rows.length,
      icon: ClipboardList,
      iconClass: "text-primary",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[95vw] max-w-2xl flex-col gap-0 p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b px-6 pb-4 pt-6 text-left">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Export Stock Taking
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tiga scope: laporan hasil, daftar selisih, atau lembar kosong
                untuk dicetak sebelum keliling gudang.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* SCOPE */}
            <section>
              <SectionHeader>Cakupan Data</SectionHeader>
              <div className="mt-2 space-y-2">
                {scopeOptions.map((opt) => (
                  <ScopeOption
                    key={opt.key}
                    active={scope === opt.key}
                    onClick={() => setScope(opt.key)}
                    title={opt.title}
                    count={opt.count}
                    icon={opt.icon}
                    iconClass={opt.iconClass}
                    recommended={opt.recommended}
                  >
                    <p className="text-xs text-muted-foreground">
                      {opt.description}
                    </p>
                  </ScopeOption>
                ))}
              </div>
            </section>

            {/* COLUMNS */}
            <section>
              <SectionHeader>Kolom yang Diekspor</SectionHeader>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {COLUMN_GROUPS.map((g) => {
                  const on = cols.has(g.key);
                  const Icon = g.icon;
                  // <label> wrapper (not <button>) so the inner shadcn Checkbox
                  // — itself a <button role="checkbox"> — is not nested inside
                  // another <button> (invalid HTML, hydration error).
                  return (
                    <label
                      key={g.key}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                        on
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent/30",
                        g.required ? "cursor-default" : "cursor-pointer",
                      )}
                    >
                      <Checkbox
                        checked={on}
                        disabled={g.required}
                        onCheckedChange={() =>
                          toggleCol(g.key, g.required)
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {g.label}
                          {g.required && (
                            <span className="text-[10px] font-normal text-muted-foreground">
                              · wajib
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                          {g.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
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
                    <span className="tabular-nums">{scopeRows.length}</span>{" "}
                    baris · scope:{" "}
                    {scope === "hasil"
                      ? "Hasil Audit"
                      : scope === "selisih"
                        ? "Selisih Saja"
                        : "Audit Sheet (Blank)"}{" "}
                    · {cols.size} grup kolom · .{format}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    File:{" "}
                    <code className="rounded bg-background px-1">
                      stock-taking-{scope}-YYYYMMDD.{format}
                    </code>
                  </p>
                </div>
              </div>
            </section>

            {/* DISCARD DRAFT */}
            {scope !== "blank" && (
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border bg-muted/20 p-3 text-xs">
                <Checkbox
                  checked={discardAfter}
                  onCheckedChange={(v) => setDiscardAfter(v === true)}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium">Buang draft setelah export?</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Kosongkan kolom Actual Stock di tabel setelah file
                    berhasil diunduh.
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t bg-muted/20 px-6 py-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <div className="flex-1" />
          <Button
            disabled={busy || scopeRows.length === 0 || cols.size === 0}
            onClick={exportFile}
          >
            {busy ? (
              <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            )}
            {busy ? "Mengekspor…" : `Export ${scopeRows.length} Baris`}
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
  icon: LucideIcon;
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
          active ? "border-primary bg-primary" : "border-muted-foreground/40",
        )}
      >
        {active && (
          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
          <Icon className={cn("h-4 w-4", iconClass ?? "text-foreground")} />
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

// Re-export so the client can declare its row type from one place.
export type { AuditRow };
