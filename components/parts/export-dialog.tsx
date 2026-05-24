"use client";

import {
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Filter as FilterIcon,
  Info,
  Tag,
  TrendingUp,
  MapPin,
  Wallet,
  ClipboardList,
  User,
  RefreshCw,
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
import {
  getAllPartsForExport,
  type PartTableRow,
} from "@/lib/actions/parts.actions";
import { formatDateTime } from "@/lib/utils/format";

type Scope = "filtered" | "all";
type Format = "xlsx" | "csv";

const FILTER_LABEL: Record<string, string> = {
  status: "Status",
  type: "Type",
  maker: "Maker",
  category: "Category",
  search: "Search",
  updatedFrom: "Updated from",
  updatedTo: "Updated to",
};

interface ColumnGroup {
  key:
    | "identity"
    | "stock"
    | "location"
    | "price"
    | "notes"
    | "metadata";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  defaultOn: boolean;
}

const COLUMN_GROUPS: ColumnGroup[] = [
  {
    key: "identity",
    label: "Identity",
    description: "Code, Name, Maker, Type, Source, Category, Unit",
    icon: Tag,
    required: true,
    defaultOn: true,
  },
  {
    key: "stock",
    label: "Stock",
    description: "Current Stock, Min, Std, Max",
    icon: TrendingUp,
    defaultOn: true,
  },
  {
    key: "location",
    label: "Location",
    description: "Lemari, Number, Box, Box Kecil, Storage Address, Barcode",
    icon: MapPin,
    defaultOn: true,
  },
  {
    key: "price",
    label: "Price & Asset",
    description: "Price per Unit, Total Asset (stock × price)",
    icon: Wallet,
    defaultOn: true,
  },
  {
    key: "notes",
    label: "Notes",
    description: "Description, Remarks",
    icon: ClipboardList,
    defaultOn: false,
  },
  {
    key: "metadata",
    label: "Metadata",
    description: "Status, Updated By, Updated At",
    icon: User,
    defaultOn: false,
  },
];

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rows currently shown after filters — default export scope. */
  rows: PartTableRow[];
}

/** Smart export — current filtered view or all parts, with column grouping. */
export function ExportDialog({ open, onOpenChange, rows }: ExportDialogProps) {
  const searchParams = useSearchParams();

  // Initial state is set on mount; parts-client remounts the dialog on each
  // open via `key`, so we don't need a "reset on open" effect.
  const [scope, setScope] = useState<Scope>("filtered");
  const [format, setFormat] = useState<Format>("xlsx");
  const [cols, setCols] = useState<Set<ColumnGroup["key"]>>(
    () => new Set(COLUMN_GROUPS.filter((g) => g.defaultOn).map((g) => g.key)),
  );
  const [busy, setBusy] = useState(false);
  const [allParts, setAllParts] = useState<PartTableRow[] | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);

  // Lazily load the "all parts" snapshot when the user switches to that scope.
  // This is a true side-effect (server fetch + caching), so the eslint hint
  // about cascading renders doesn't apply.
  useEffect(() => {
    if (scope !== "all" || allParts !== null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingAll(true);
    getAllPartsForExport()
      .then((data) => setAllParts(data))
      .catch(() => toast.error("Failed to load all parts data"))
      .finally(() => setLoadingAll(false));
  }, [scope, allParts]);

  /** Filter chips from the active URL search params. */
  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; value: string }[] = [];
    for (const key of Object.keys(FILTER_LABEL)) {
      const raw = searchParams.get(key);
      if (raw)
        chips.push({ key, label: FILTER_LABEL[key], value: raw });
    }
    return chips;
  }, [searchParams]);

  const targetRows: PartTableRow[] = scope === "filtered" ? rows : allParts ?? [];
  const targetCount =
    scope === "filtered" ? rows.length : allParts?.length ?? 0;

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
  const buildRow = (p: PartTableRow): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    if (cols.has("identity")) {
      out["Part Code"] = p.partCode;
      out["Part Name"] = p.partName;
      out["Maker"] = p.maker;
      out["Type"] = p.type;
      out["Source"] = p.partClass;
      out["Category"] = p.category;
      out["Unit"] = p.unit;
    }
    if (cols.has("stock")) {
      out["Stock"] = p.currentStock;
      out["Min Stock"] = p.minStock;
      out["Std Stock"] = p.stdStock ?? "";
      out["Max Stock"] = p.maxStock ?? "";
    }
    if (cols.has("location")) {
      out["Lemari"] = p.storageType ?? "";
      out["Storage Number"] = p.storageNumber ?? "";
      out["Box"] = p.storageBox ?? "";
      out["Box Kecil"] = p.storageBoxKecil ?? "";
      out["Storage Address"] = p.storageAddr === "—" ? "" : p.storageAddr;
      out["Barcode"] = p.barcode ?? "";
    }
    if (cols.has("price")) {
      out["Price"] = p.price ?? 0;
      out["Total Asset"] = (p.price ?? 0) * p.currentStock;
    }
    if (cols.has("notes")) {
      out["Description"] = p.description ?? "";
      out["Remarks"] = p.remarks ?? "";
    }
    if (cols.has("metadata")) {
      out["Status"] = p.status;
      out["Stock Status"] = p.stockStatus;
      out["Updated By"] = p.updatedByName;
      out["Updated At"] = formatDateTime(p.updatedAt);
    }
    return out;
  };

  const exportFile = () => {
    if (targetRows.length === 0) {
      toast.error("Tidak ada part untuk diekspor");
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
      XLSX.utils.book_append_sheet(book, sheet, "Master Part");
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const scopeTag = scope === "filtered" ? "filtered" : "all";
      XLSX.writeFile(
        book,
        `master-parts-${scopeTag}-${stamp}.${format}`,
      );
      toast.success(`${data.length} part diekspor ke ${format.toUpperCase()}`);
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
              <DialogTitle className="text-lg">Export Master Part</DialogTitle>
              <DialogDescription className="text-xs">
                Pilih cakupan data, kolom, dan format. File hasil bisa di-import
                kembali via dialog Import.
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
                      Tidak ada filter — sama dengan semua part yang tampil
                      sekarang.
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
                  title="Semua part"
                  count={
                    loadingAll
                      ? null
                      : allParts?.length ?? null
                  }
                  loading={loadingAll}
                >
                  <p className="text-xs text-muted-foreground">
                    Ekspor semua part di database (kecuali yang sudah dihapus).
                    Cocok untuk backup atau migrasi.
                  </p>
                </ScopeOption>
              </div>
            </section>

            {/* COLUMNS */}
            <section>
              <SectionHeader icon={Tag}>Kolom yang Diekspor</SectionHeader>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {COLUMN_GROUPS.map((g) => {
                  const on = cols.has(g.key);
                  const Icon = g.icon;
                  // Use <label> (not <button>) so the inner shadcn Checkbox —
                  // which is itself a <button role="checkbox"> — is not nested
                  // inside another <button> (invalid HTML, hydration error).
                  return (
                    <label
                      key={g.key}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                        on
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent/30",
                        g.required
                          ? "cursor-default"
                          : "cursor-pointer",
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
                    <span className="tabular-nums tabular-nums">
                      {loadingAll && scope === "all"
                        ? "…"
                        : targetCount}
                    </span>{" "}
                    part · {cols.size} grup kolom · .{format}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    File akan diberi nama{" "}
                    <code className="rounded bg-background px-1 tabular-nums">
                      master-parts-{scope}-YYYYMMDD.{format}
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
              : `Export ${loadingAll && scope === "all" ? "…" : targetCount} Part`}
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
          <span className="ml-auto rounded-md bg-muted px-2 py-0.5 tabular-nums text-xs tabular-nums">
            {loading ? "…" : count ?? "?"} part
          </span>
        </div>
        {children}
      </div>
    </button>
  );
}
