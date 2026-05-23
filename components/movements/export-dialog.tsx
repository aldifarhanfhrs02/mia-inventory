"use client";

import {
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Filter as FilterIcon,
  Info,
  Layers,
  Package,
  RefreshCw,
  TrendingUp,
  User,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { formatDate } from "@/lib/utils/format";
import {
  getAllMovementsForExport,
  type MovementRow,
} from "@/lib/actions/movements.actions";

type Scope = "filtered" | "all";
type Format = "xlsx" | "csv";

const FILTER_LABEL: Record<string, string> = {
  type: "Source",
  partType: "Part Type",
  dateFrom: "Periode dari",
  dateTo: "Periode sampai",
  search: "Pencarian",
};

const SOURCE_LABEL: Record<string, string> = {
  INITIAL: "System",
  IN: "Stock IN",
  OUT: "Stock OUT",
};

interface ColumnGroup {
  key: "datetime" | "source" | "part" | "quantity" | "stock" | "people" | "project";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  defaultOn: boolean;
}

const COLUMN_GROUPS: ColumnGroup[] = [
  {
    key: "datetime",
    label: "Date & Time",
    description: "Tanggal dan jam transaksi",
    icon: Layers,
    required: true,
    defaultOn: true,
  },
  {
    key: "source",
    label: "Source",
    description: "System / Stock IN / Stock OUT",
    icon: Database,
    required: true,
    defaultOn: true,
  },
  {
    key: "part",
    label: "Part",
    description: "Part Name, Part Code, Maker, Part Type, Unit",
    icon: Package,
    defaultOn: true,
  },
  {
    key: "quantity",
    label: "Quantity",
    description: "Jumlah transaksi (signed: +IN/System, −OUT)",
    icon: TrendingUp,
    required: true,
    defaultOn: true,
  },
  {
    key: "stock",
    label: "Stock Movement",
    description: "Stock Before, Stock After",
    icon: TrendingUp,
    defaultOn: true,
  },
  {
    key: "people",
    label: "People",
    description: "Requestor, Inputer",
    icon: User,
    defaultOn: true,
  },
  {
    key: "project",
    label: "Project",
    description: "Project terkait (jika ada)",
    icon: Layers,
    defaultOn: false,
  },
];

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rows currently shown after filters — default export scope. */
  rows: MovementRow[];
}

/** Smart export — current filtered view or all transactions, column groups. */
export function ExportDialog({ open, onOpenChange, rows }: ExportDialogProps) {
  const searchParams = useSearchParams();

  const [scope, setScope] = useState<Scope>("filtered");
  const [format, setFormat] = useState<Format>("xlsx");
  const [cols, setCols] = useState<Set<ColumnGroup["key"]>>(
    () => new Set(COLUMN_GROUPS.filter((g) => g.defaultOn).map((g) => g.key)),
  );
  const [busy, setBusy] = useState(false);
  const [allRows, setAllRows] = useState<MovementRow[] | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);

  // Lazy-load "all transactions" snapshot when the user picks that scope.
  useEffect(() => {
    if (scope !== "all" || allRows !== null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingAll(true);
    getAllMovementsForExport()
      .then((data) => setAllRows(data))
      .catch(() => toast.error("Gagal memuat semua transaksi"))
      .finally(() => setLoadingAll(false));
  }, [scope, allRows]);

  /** Filter chips from the active URL search params. */
  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; value: string }[] = [];
    for (const key of Object.keys(FILTER_LABEL)) {
      const raw = searchParams.get(key);
      if (raw) {
        const v =
          key === "type" && SOURCE_LABEL[raw] ? SOURCE_LABEL[raw] : raw;
        chips.push({ key, label: FILTER_LABEL[key], value: v });
      }
    }
    return chips;
  }, [searchParams]);

  const targetRows: MovementRow[] =
    scope === "filtered" ? rows : allRows ?? [];
  const targetCount = scope === "filtered" ? rows.length : allRows?.length ?? 0;

  const toggleCol = (key: ColumnGroup["key"], required?: boolean) => {
    if (required) return;
    setCols((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /** Build a row object based on the selected column groups. */
  const buildRow = (m: MovementRow): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    const d = new Date(m.createdAt);
    if (cols.has("datetime")) {
      out["Date"] = formatDate(d);
      out["Time"] = d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (cols.has("source")) {
      out["Source"] = SOURCE_LABEL[m.type] ?? m.type;
    }
    if (cols.has("part")) {
      out["Part Name"] = m.partName;
      out["Part Code"] = m.partCode;
      out["Maker"] = m.maker;
      out["Part Type"] = m.partType;
      out["Unit"] = m.unit;
    }
    if (cols.has("quantity")) {
      const sign = m.type === "OUT" ? -1 : 1;
      out["Quantity"] = sign * m.quantity;
    }
    if (cols.has("stock")) {
      out["Stock Before"] = m.stockBefore;
      out["Stock After"] = m.stockAfter;
    }
    if (cols.has("people")) {
      out["Requestor"] = m.requestor;
      out["Inputer"] = m.inputerName;
    }
    if (cols.has("project")) {
      out["Project"] = m.project ?? "";
    }
    return out;
  };

  const exportFile = () => {
    if (targetRows.length === 0) {
      toast.error("Tidak ada transaksi untuk diekspor");
      return;
    }
    if (cols.size === 0) {
      toast.error("Pilih minimal satu grup kolom");
      return;
    }
    setBusy(true);
    try {
      const data = targetRows.map(buildRow);
      const sheet = XLSX.utils.json_to_sheet(data);
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Stock Movement");
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const scopeTag = scope === "filtered" ? "filtered" : "all";
      XLSX.writeFile(book, `stock-movement-${scopeTag}-${stamp}.${format}`);
      toast.success(
        `${data.length} transaksi diekspor ke ${format.toUpperCase()}`,
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
                Export Stock Movement
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pilih cakupan data, kolom, dan format file. Cocok untuk
                pelaporan, audit, atau backup.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* SCOPE */}
            <section>
              <SectionHeader icon={Database}>Cakupan Data</SectionHeader>
              <div className="mt-2 space-y-2">
                <ScopeOption
                  active={scope === "filtered"}
                  onClick={() => setScope("filtered")}
                  title="Sesuai filter aktif"
                  count={rows.length}
                  recommended
                >
                  {activeFilters.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Tidak ada filter — sama dengan semua transaksi yang
                      tampil sekarang.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1">
                      <FilterIcon className="h-3 w-3 text-muted-foreground" />
                      {activeFilters.map((f) => (
                        <span
                          key={f.key}
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground"
                        >
                          {f.label}: {f.value}
                        </span>
                      ))}
                    </div>
                  )}
                </ScopeOption>

                <ScopeOption
                  active={scope === "all"}
                  onClick={() => setScope("all")}
                  title="Semua transaksi"
                  count={loadingAll ? null : allRows?.length ?? null}
                  loading={loadingAll}
                >
                  <p className="text-xs text-muted-foreground">
                    Ekspor semua transaksi (System, Stock IN, Stock OUT) tanpa
                    memperhatikan filter. Cocok untuk audit / backup.
                  </p>
                </ScopeOption>
              </div>
            </section>

            {/* COLUMNS */}
            <section>
              <SectionHeader icon={Package}>
                Kolom yang Diekspor
              </SectionHeader>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {COLUMN_GROUPS.map((g) => {
                  const on = cols.has(g.key);
                  const Icon = g.icon;
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => toggleCol(g.key, g.required)}
                      disabled={g.required}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                        on
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent/30",
                        g.required && "cursor-default",
                      )}
                    >
                      <Checkbox
                        checked={on}
                        disabled={g.required}
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
                    </button>
                  );
                })}
              </div>
            </section>

            {/* FORMAT */}
            <section>
              <SectionHeader icon={FileSpreadsheet}>Format File</SectionHeader>
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
                    <span className="tabular-nums">
                      {loadingAll && scope === "all" ? "…" : targetCount}
                    </span>{" "}
                    transaksi · {cols.size} grup kolom · .{format}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    File akan diberi nama{" "}
                    <code className="rounded bg-background px-1">
                      stock-movement-{scope}-YYYYMMDD.{format}
                    </code>
                    .
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center gap-2 border-t bg-muted/20 px-6 py-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <div className="flex-1" />
          <Button
            disabled={busy || loadingAll || targetCount === 0 || cols.size === 0}
            onClick={exportFile}
          >
            {busy ? (
              <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            )}
            {busy
              ? "Mengekspor…"
              : `Export ${loadingAll && scope === "all" ? "…" : targetCount} Transaksi`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

function ScopeOption({
  active,
  onClick,
  title,
  count,
  loading,
  recommended,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  count: number | null;
  loading?: boolean;
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
          {title}
          {recommended && (
            <span className="rounded-full bg-chart-2/15 px-1.5 py-0.5 text-[10px] font-semibold text-chart-2">
              Direkomendasikan
            </span>
          )}
          <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums">
            {loading ? "…" : count ?? "?"} transaksi
          </span>
        </div>
        {children}
      </div>
    </button>
  );
}
