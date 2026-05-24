"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileWarning,
  Filter,
  HelpCircle,
  Info,
  Package,
  RefreshCw,
  Search as SearchIcon,
  ShoppingCart,
  Upload,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Fragment,
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { searchParts } from "@/lib/actions/search.actions";
import type {
  SearchInputRow,
  SearchMatchStatus,
  SearchResult,
  SearchSummary,
} from "@/lib/types";
import { SearchExportDialog } from "./search-export-dialog";

// ─────────────────────────────────────────────────────────────────────────────
// Header detection — case-insensitive, ignores spaces/underscores/dashes
// ─────────────────────────────────────────────────────────────────────────────

const HEADER_ALIASES: Record<keyof InputCell, string[]> = {
  partCode: ["partcode", "code", "kode"],
  partName: ["partname", "name", "nama"],
  maker: ["maker", "brand", "merk"],
  qtyNeeded: ["qtyneeded", "qty", "quantity", "jumlah"],
};

interface InputCell {
  partCode: string;
  partName: string;
  maker: string;
  qtyNeeded: number;
}

function normHeader(s: string): string {
  return s.toLowerCase().replace(/[\s_\-]/g, "");
}

function getCell(
  row: Record<string, unknown>,
  field: keyof InputCell,
): unknown {
  const aliases = HEADER_ALIASES[field];
  for (const k of Object.keys(row)) {
    const norm = normHeader(k);
    if (aliases.some((a) => norm === a || norm.includes(a))) return row[k];
  }
  return undefined;
}

const asString = (v: unknown): string =>
  v == null ? "" : String(v).trim();

const asNumber = (v: unknown): number => {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-row validation
// ─────────────────────────────────────────────────────────────────────────────

interface RowIssue {
  field: keyof ParsedRow | string;
  level: "error" | "warning";
  message: string;
}

interface ParsedRow extends SearchInputRow {
  status: "valid" | "warning" | "error";
  issues: RowIssue[];
}

function validateRow(r: SearchInputRow): ParsedRow {
  const issues: RowIssue[] = [];
  const hasCode = r.partCode.trim().length > 0;
  const hasName = r.partName.trim().length > 0;

  if (!hasCode && !hasName) {
    issues.push({
      field: "partCode",
      level: "error",
      message: "Part Code atau Part Name wajib diisi (salah satu)",
    });
  }
  if (r.qtyNeeded <= 0) {
    issues.push({
      field: "qtyNeeded",
      level: "error",
      message: "Qty Needed harus lebih dari 0",
    });
  }
  if (!hasCode && hasName) {
    issues.push({
      field: "partCode",
      level: "warning",
      message:
        "Tidak ada Part Code — pencocokan akan menggunakan fuzzy match (Part Name + Maker)",
    });
  }
  if (hasCode && !hasName) {
    issues.push({
      field: "partName",
      level: "warning",
      message: "Tidak ada Part Name — fuzzy fallback tidak tersedia",
    });
  }

  const hasError = issues.some((i) => i.level === "error");
  const hasWarn = issues.some((i) => i.level === "warning");
  return {
    ...r,
    status: hasError ? "error" : hasWarn ? "warning" : "valid",
    issues,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Template download
// ─────────────────────────────────────────────────────────────────────────────

function downloadTemplate() {
  const data = [
    {
      "Part Code": "MIA-EL-006",
      "Part Name": "Sensor Proximity M12",
      Maker: "Keyence",
      "Qty Needed": 5,
    },
    {
      "Part Code": "",
      "Part Name": "Bearing 6205",
      Maker: "SKF",
      "Qty Needed": 10,
    },
    {
      "Part Code": "MIA-EL-999",
      "Part Name": "Custom Sensor 24V",
      Maker: "—",
      "Qty Needed": 3,
    },
  ];
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Part Search Template");
  XLSX.writeFile(book, "template-part-search.xlsx");
}

// ─────────────────────────────────────────────────────────────────────────────
// Status / icon meta — used in Step 3
// ─────────────────────────────────────────────────────────────────────────────

interface ResultStatusMeta {
  label: string;
  shortLabel: string;
  Icon: LucideIcon;
  pillClass: string;
  rowClass: string;
}

/** Re-label `exact` rows that have enough stock as "Sudah Tersedia". */
function resolveResultLabel(r: SearchResult): SearchMatchStatus | "available" {
  if (
    r.status === "exact" &&
    r.matchedPart &&
    r.matchedPart.currentStock >= r.qtyNeeded
  ) {
    return "available";
  }
  return r.status;
}

const RESULT_META: Record<
  SearchMatchStatus | "available",
  ResultStatusMeta
> = {
  available: {
    label: "Sudah Tersedia",
    shortLabel: "Tersedia",
    Icon: CheckCircle2,
    pillClass:
      "bg-chart-2/15 text-chart-2 border border-chart-2/20",
    rowClass: "hover:bg-chart-2/5",
  },
  exact: {
    label: "Sudah Tersedia",
    shortLabel: "Tersedia",
    Icon: CheckCircle2,
    pillClass:
      "bg-chart-2/15 text-chart-2 border border-chart-2/20",
    rowClass: "hover:bg-chart-2/5",
  },
  shortage: {
    label: "Shortage",
    shortLabel: "Shortage",
    Icon: AlertTriangle,
    pillClass:
      "bg-chart-3/15 text-chart-3 border border-chart-3/20",
    rowClass: "hover:bg-chart-3/5 bg-chart-3/5",
  },
  possible: {
    label: "Kandidat",
    shortLabel: "Kandidat",
    Icon: HelpCircle,
    pillClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/20",
    rowClass: "hover:bg-sky-500/5",
  },
  not_found: {
    label: "Perlu Dibeli",
    shortLabel: "Perlu Beli",
    Icon: XCircle,
    pillClass:
      "bg-destructive/15 text-destructive border border-destructive/20",
    rowClass: "hover:bg-destructive/5 bg-destructive/5",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

type Phase = "upload" | "preview" | "results";
type PreviewFilter = "all" | "valid" | "warning" | "error";
type ResultFilter = "all" | "tobuy" | SearchMatchStatus | "available";

export function SearchClient() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Preview-step state
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>("all");
  const [searching, setSearching] = useState(false);

  // Results-step state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [summary, setSummary] = useState<SearchSummary | null>(null);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const reset = () => {
    setPhase("upload");
    setFileName("");
    setRows([]);
    setSelected(new Set());
    setPreviewFilter("all");
    setResults([]);
    setSummary(null);
    setResultFilter("all");
    setExpanded(null);
  };

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setParsing(true);
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      if (json.length === 0) {
        toast.error("File kosong — tidak ada baris untuk diproses");
        setParsing(false);
        return;
      }
      if (json.length > 500) {
        toast.warning(
          `File berisi ${json.length} baris — hanya 500 pertama yang diproses`,
        );
      }

      const parsed: ParsedRow[] = json.slice(0, 500).map((r, i) => {
        const row: SearchInputRow = {
          row: i + 2, // header is row 1, so data starts at 2 in Excel
          partCode: asString(getCell(r, "partCode")),
          partName: asString(getCell(r, "partName")),
          maker: asString(getCell(r, "maker")),
          qtyNeeded: asNumber(getCell(r, "qtyNeeded")),
        };
        return validateRow(row);
      });

      const recognised = parsed.some(
        (p) => p.partCode || p.partName || p.maker || p.qtyNeeded > 0,
      );
      if (!recognised) {
        toast.error(
          "Header kolom tidak dikenali. Unduh template untuk format yang benar.",
        );
        setParsing(false);
        return;
      }

      setFileName(file.name);
      setRows(parsed);
      // Pre-select all importable rows (valid + warning).
      setSelected(
        new Set(
          parsed.filter((p) => p.status !== "error").map((p) => p.row),
        ),
      );
      setPhase("preview");
    } catch {
      toast.error("Gagal membaca file — pastikan format .xlsx, .xls, atau .csv");
    } finally {
      setParsing(false);
    }
  }, []);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  // ── Preview stats ─────────────────────────────────────────────────────────
  const previewStats = useMemo(() => {
    const valid = rows.filter((r) => r.status === "valid").length;
    const warning = rows.filter((r) => r.status === "warning").length;
    const error = rows.filter((r) => r.status === "error").length;
    return { total: rows.length, valid, warning, error };
  }, [rows]);

  const visiblePreview = useMemo(
    () =>
      previewFilter === "all"
        ? rows
        : rows.filter((r) => r.status === previewFilter),
    [rows, previewFilter],
  );

  const togglePreviewRow = (rowNo: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(rowNo)) next.delete(rowNo);
      else next.add(rowNo);
      return next;
    });
  };

  const togglePreviewAll = () => {
    setSelected((s) => {
      const next = new Set(s);
      const importable = visiblePreview.filter((r) => r.status !== "error");
      const allOn = importable.every((r) => next.has(r.row));
      if (allOn) importable.forEach((r) => next.delete(r.row));
      else importable.forEach((r) => next.add(r.row));
      return next;
    });
  };

  const selectedCount = useMemo(
    () => rows.filter((r) => selected.has(r.row)).length,
    [rows, selected],
  );

  // ── Run search ────────────────────────────────────────────────────────────
  const runSearch = async () => {
    const payload: SearchInputRow[] = rows
      .filter((r) => selected.has(r.row) && r.status !== "error")
      .map(({ row, partCode, partName, maker, qtyNeeded }) => ({
        row,
        partCode,
        partName,
        maker,
        qtyNeeded,
      }));
    if (payload.length === 0) {
      toast.error("Tidak ada baris valid yang dipilih");
      return;
    }
    setSearching(true);
    const res = await searchParts(fileName, payload);
    setSearching(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setResults(res.data.results);
    setSummary(res.data.summary);
    setResultFilter("all");
    setExpanded(null);
    setPhase("results");
  };

  // ── Result derived counts ─────────────────────────────────────────────────
  const resultCounts = useMemo(() => {
    let available = 0;
    let shortage = 0;
    let possible = 0;
    let notFound = 0;
    for (const r of results) {
      const k = resolveResultLabel(r);
      if (k === "available" || k === "exact") available++;
      else if (k === "shortage") shortage++;
      else if (k === "possible") possible++;
      else notFound++;
    }
    return { available, shortage, possible, notFound, total: results.length };
  }, [results]);

  const toBuyCount = resultCounts.shortage + resultCounts.notFound;

  const visibleResults = useMemo(() => {
    if (resultFilter === "all") return results;
    if (resultFilter === "tobuy") {
      return results.filter(
        (r) => r.status === "shortage" || r.status === "not_found",
      );
    }
    return results.filter((r) => resolveResultLabel(r) === resultFilter);
  }, [results, resultFilter]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {phase === "upload" && (
        <UploadStep
          parsing={parsing}
          dragOver={dragOver}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onBrowse={() => fileRef.current?.click()}
          onTemplate={downloadTemplate}
          fileRef={fileRef}
          onFileChosen={(f) => handleFile(f)}
        />
      )}

      {phase === "preview" && (
        <PreviewStep
          fileName={fileName}
          stats={previewStats}
          filter={previewFilter}
          onFilterChange={setPreviewFilter}
          rows={visiblePreview}
          selected={selected}
          selectedCount={selectedCount}
          onToggleRow={togglePreviewRow}
          onToggleAll={togglePreviewAll}
          onReset={reset}
          onSearch={runSearch}
          searching={searching}
        />
      )}

      {phase === "results" && summary && (
        <ResultsStep
          fileName={fileName}
          counts={resultCounts}
          toBuyCount={toBuyCount}
          filter={resultFilter}
          onFilterChange={setResultFilter}
          rows={visibleResults}
          expanded={expanded}
          onExpand={setExpanded}
          onNewSearch={reset}
          onExport={() => setExportOpen(true)}
        />
      )}

      <SearchExportDialog
        key={`search-export-${exportOpen ? "open" : "closed"}`}
        open={exportOpen}
        onOpenChange={setExportOpen}
        results={results}
        fileName={fileName}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

function UploadStep({
  parsing,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowse,
  onTemplate,
  fileRef,
  onFileChosen,
}: {
  parsing: boolean;
  dragOver: boolean;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onBrowse: () => void;
  onTemplate: () => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFileChosen: (f: File | undefined) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={onBrowse}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed py-14 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "hover:border-primary/50 hover:bg-accent/30",
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={(e) => onFileChosen(e.target.files?.[0])}
        />
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
            dragOver
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {parsing ? (
            <RefreshCw className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {parsing
              ? "Membaca file…"
              : dragOver
                ? "Lepas file untuk upload"
                : "Drag & drop file daftar pembelian, atau klik untuk browse"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            .xlsx, .xls, atau .csv · maksimal 500 baris per upload
          </p>
        </div>
      </div>

      {/* Two helper info cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FileCheck2 className="h-3.5 w-3.5" />
            Kolom yang Dikenali
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Wajib:</strong> Part Code{" "}
            <em>atau</em> Part Name (salah satu), Qty Needed.
            <br />
            <strong className="text-foreground">Opsional:</strong> Maker
            (memperkuat hasil fuzzy match).
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            Cara Pencocokan
          </div>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            <li>
              • <strong>Level 1</strong>: Part Code persis → match langsung
            </li>
            <li>
              • <strong>Level 2</strong>: fuzzy Part Name + Maker → kandidat
            </li>
            <li>
              • <strong>Level 3</strong>: tidak ditemukan → perlu dibeli
            </li>
            <li>
              •{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTemplate();
                }}
                className="font-semibold text-primary hover:underline"
              >
                Unduh template
              </button>{" "}
              untuk format yang benar
            </li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onTemplate}>
          <Download className="mr-1.5 h-4 w-4" />
          Download Template
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

function PreviewStep({
  fileName,
  stats,
  filter,
  onFilterChange,
  rows,
  selected,
  selectedCount,
  onToggleRow,
  onToggleAll,
  onReset,
  onSearch,
  searching,
}: {
  fileName: string;
  stats: { total: number; valid: number; warning: number; error: number };
  filter: PreviewFilter;
  onFilterChange: (f: PreviewFilter) => void;
  rows: ParsedRow[];
  selected: Set<number>;
  selectedCount: number;
  onToggleRow: (rowNo: number) => void;
  onToggleAll: () => void;
  onReset: () => void;
  onSearch: () => void;
  searching: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* File header */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{fileName}</span>
          <span className="text-muted-foreground tabular-nums">
            · {stats.total} baris
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Ganti File
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total Baris"
          value={stats.total}
          icon={FileSpreadsheet}
          tone="neutral"
        />
        <StatCard
          label="Valid"
          value={stats.valid}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Warning"
          value={stats.warning}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label="Error"
          value={stats.error}
          icon={XCircle}
          tone="danger"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <FilterPill
          active={filter === "all"}
          onClick={() => onFilterChange("all")}
        >
          Semua · {stats.total}
        </FilterPill>
        <FilterPill
          active={filter === "valid"}
          onClick={() => onFilterChange("valid")}
          tone="success"
        >
          Valid · {stats.valid}
        </FilterPill>
        <FilterPill
          active={filter === "warning"}
          onClick={() => onFilterChange("warning")}
          tone="warning"
        >
          Warning · {stats.warning}
        </FilterPill>
        <FilterPill
          active={filter === "error"}
          onClick={() => onFilterChange("error")}
          tone="danger"
        >
          Error · {stats.error}
        </FilterPill>
        <div className="ml-auto text-xs text-muted-foreground">
          {selectedCount} dari {stats.total} baris dipilih
        </div>
      </div>

      {stats.error > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-xs">
            <strong className="text-destructive">
              {stats.error} baris bermasalah
            </strong>{" "}
            akan dilewati. Hover ke ikon status pada setiap baris untuk detail
            masalah.
          </p>
        </div>
      )}

      <PreviewTable
        rows={rows}
        selected={selected}
        onToggleRow={onToggleRow}
        onToggleAll={onToggleAll}
      />

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t pt-3">
        <Button variant="ghost" onClick={onReset}>
          Batal
        </Button>
        <div className="flex-1" />
        <Button
          disabled={searching || selectedCount === 0}
          onClick={onSearch}
        >
          {searching ? (
            <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <SearchIcon className="mr-1.5 h-4 w-4" />
          )}
          {searching
            ? "Mencocokkan…"
            : `Cari ${selectedCount} Part di Inventory`}
        </Button>
      </div>
    </div>
  );
}

function PreviewTable({
  rows,
  selected,
  onToggleRow,
  onToggleAll,
}: {
  rows: ParsedRow[];
  selected: Set<number>;
  onToggleRow: (rowNo: number) => void;
  onToggleAll: () => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
        <FileWarning className="h-7 w-7 opacity-40" />
        Tidak ada baris yang cocok dengan filter ini.
      </div>
    );
  }
  const importable = rows.filter((r) => r.status !== "error");
  const allChecked =
    importable.length > 0 && importable.every((r) => selected.has(r.row));

  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-md border">
        <div className="max-h-[420px] overflow-auto">
          <Table className="text-xs">
            <TableHeader className="sticky top-0 bg-muted/60 backdrop-blur">
              <TableRow>
                <TableHead className="w-9 px-2">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={onToggleAll}
                  />
                </TableHead>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="w-9" />
                <TableHead>Part Code</TableHead>
                <TableHead>Part Name</TableHead>
                <TableHead>Maker</TableHead>
                <TableHead className="text-right">Qty Needed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const isError = r.status === "error";
                const isWarn = r.status === "warning";
                const isOn = selected.has(r.row);
                return (
                  <TableRow
                    key={r.row}
                    className={cn(
                      "transition-colors",
                      isError && "bg-destructive/5",
                      isWarn && "bg-chart-3/5",
                      !isOn && !isError && "opacity-60",
                    )}
                  >
                    <TableCell className="px-2">
                      <Checkbox
                        checked={isOn}
                        disabled={isError}
                        onCheckedChange={() => onToggleRow(r.row)}
                      />
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {r.row}
                    </TableCell>
                    <TableCell>
                      <PreviewStatusIcon row={r} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <PreviewCell
                        value={r.partCode || "—"}
                        field="partCode"
                        row={r}
                      />
                    </TableCell>
                    <TableCell>
                      <PreviewCell
                        value={r.partName || "—"}
                        field="partName"
                        row={r}
                      />
                    </TableCell>
                    <TableCell>{r.maker || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <PreviewCell
                        value={r.qtyNeeded}
                        field="qtyNeeded"
                        row={r}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}

function PreviewStatusIcon({ row }: { row: ParsedRow }) {
  if (row.status === "valid") {
    return (
      <span title="Valid">
        <CheckCircle2 className="h-4 w-4 text-chart-2" />
      </span>
    );
  }
  const Icon = row.status === "error" ? XCircle : AlertTriangle;
  const color =
    row.status === "error" ? "text-destructive" : "text-chart-3";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Icon className={cn("h-4 w-4", color)} />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="max-w-xs whitespace-normal bg-popover text-popover-foreground"
      >
        <ul className="space-y-1 text-xs">
          {row.issues.map((iss, i) => (
            <li key={i} className="flex items-start gap-1.5">
              {iss.level === "error" ? (
                <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
              ) : (
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-chart-3" />
              )}
              <span>{iss.message}</span>
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

function PreviewCell({
  value,
  field,
  row,
}: {
  value: React.ReactNode;
  field: keyof ParsedRow | string;
  row: ParsedRow;
}) {
  const issue = row.issues.find((i) => i.field === field);
  if (!issue) return <span>{value}</span>;
  return (
    <span
      className={cn(
        "underline decoration-wavy underline-offset-2",
        issue.level === "error"
          ? "decoration-destructive"
          : "decoration-chart-3",
      )}
      title={issue.message}
    >
      {value}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — RESULTS
// ─────────────────────────────────────────────────────────────────────────────

function ResultsStep({
  fileName,
  counts,
  toBuyCount,
  filter,
  onFilterChange,
  rows,
  expanded,
  onExpand,
  onNewSearch,
  onExport,
}: {
  fileName: string;
  counts: {
    total: number;
    available: number;
    shortage: number;
    possible: number;
    notFound: number;
  };
  toBuyCount: number;
  filter: ResultFilter;
  onFilterChange: (f: ResultFilter) => void;
  rows: SearchResult[];
  expanded: number | null;
  onExpand: (row: number | null) => void;
  onNewSearch: () => void;
  onExport: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* File header */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{fileName}</span>
          <span className="text-muted-foreground tabular-nums">
            · {counts.total} baris diproses
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNewSearch}>
            <ArrowDownToLine className="mr-1.5 h-4 w-4" />
            Cari File Baru
          </Button>
          <Button size="sm" onClick={onExport}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Action banner — the most important number on the page */}
      {toBuyCount > 0 ? (
        <button
          type="button"
          onClick={() => onFilterChange("tobuy")}
          className="flex w-full items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left transition-colors hover:bg-destructive/10"
        >
          <div className="rounded-md bg-destructive/15 p-2 text-destructive">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              <span className="tabular-nums text-destructive">
                {toBuyCount}
              </span>{" "}
              part perlu dibeli
            </p>
            <p className="text-xs text-muted-foreground">
              Sisanya sudah tersedia di inventory — klik untuk filter ke daftar
              pembelian.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-chart-2/30 bg-chart-2/5 p-3">
          <div className="rounded-md bg-chart-2/15 p-2 text-chart-2">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Semua part sudah tersedia</p>
            <p className="text-xs text-muted-foreground">
              Tidak perlu pembelian baru — gunakan stok yang ada di inventory.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Total Baris"
          value={counts.total}
          icon={FileSpreadsheet}
          tone="neutral"
        />
        <StatCard
          label="Sudah Tersedia"
          value={counts.available}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Shortage"
          value={counts.shortage}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label="Kandidat"
          value={counts.possible}
          icon={HelpCircle}
          tone="info"
        />
        <StatCard
          label="Perlu Dibeli"
          value={counts.notFound}
          icon={XCircle}
          tone="danger"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <FilterPill
          active={filter === "all"}
          onClick={() => onFilterChange("all")}
        >
          Semua · {counts.total}
        </FilterPill>
        <FilterPill
          active={filter === "tobuy"}
          onClick={() => onFilterChange("tobuy")}
          tone="danger"
        >
          Perlu Aksi · {toBuyCount}
        </FilterPill>
        <FilterPill
          active={filter === "available"}
          onClick={() => onFilterChange("available")}
          tone="success"
        >
          Tersedia · {counts.available}
        </FilterPill>
        <FilterPill
          active={filter === "shortage"}
          onClick={() => onFilterChange("shortage")}
          tone="warning"
        >
          Shortage · {counts.shortage}
        </FilterPill>
        <FilterPill
          active={filter === "possible"}
          onClick={() => onFilterChange("possible")}
          tone="info"
        >
          Kandidat · {counts.possible}
        </FilterPill>
        <FilterPill
          active={filter === "not_found"}
          onClick={() => onFilterChange("not_found")}
          tone="danger"
        >
          Perlu Dibeli · {counts.notFound}
        </FilterPill>
      </div>

      <ResultsTable rows={rows} expanded={expanded} onExpand={onExpand} />
    </div>
  );
}

function ResultsTable({
  rows,
  expanded,
  onExpand,
}: {
  rows: SearchResult[];
  expanded: number | null;
  onExpand: (row: number | null) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
        <FileWarning className="h-7 w-7 opacity-40" />
        Tidak ada hasil yang cocok dengan filter ini.
      </div>
    );
  }
  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-11 w-12 text-xs font-medium text-muted-foreground">
                #
              </TableHead>
              <TableHead className="h-11 w-9" />
              <TableHead className="h-11 text-xs font-medium text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="h-11 text-xs font-medium text-muted-foreground">
                Input
              </TableHead>
              <TableHead className="h-11 text-right text-xs font-medium text-muted-foreground">
                Qty Needed
              </TableHead>
              <TableHead className="h-11 text-xs font-medium text-muted-foreground">
                Match
              </TableHead>
              <TableHead className="h-11 text-right text-xs font-medium text-muted-foreground">
                Stock
              </TableHead>
              <TableHead className="h-11 text-right text-xs font-medium text-muted-foreground">
                Qty to Buy
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const labelKey = resolveResultLabel(r);
              const meta = RESULT_META[labelKey];
              const isOpen = expanded === r.row;
              const matched = r.matchedPart;
              return (
                <Fragment key={r.row}>
                  <TableRow
                    className={cn("cursor-pointer transition-colors", meta.rowClass)}
                    onClick={() => onExpand(isOpen ? null : r.row)}
                  >
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {r.row}
                    </TableCell>
                    <TableCell>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold",
                          meta.pillClass,
                        )}
                      >
                        <meta.Icon className="h-3.5 w-3.5" />
                        {meta.shortLabel}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        <p className="font-medium">{r.partName || "—"}</p>
                        <p className="tabular-nums text-xs text-muted-foreground">
                          {r.partCode || "—"}
                          {r.maker && ` · ${r.maker}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-semibold">
                      {r.qtyNeeded}
                    </TableCell>
                    <TableCell>
                      {matched ? (
                        <div className="leading-tight">
                          <Link
                            href={`/parts?search=${encodeURIComponent(matched.partCode)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {matched.partName}
                          </Link>
                          <p className="tabular-nums text-xs text-muted-foreground">
                            {matched.partCode} · {matched.storageAddr}
                          </p>
                        </div>
                      ) : r.candidates.length > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {r.candidates.length} kandidat — klik untuk lihat
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {matched ? (
                        <>
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              matched.currentStock >= r.qtyNeeded
                                ? "text-chart-2"
                                : "text-chart-3",
                            )}
                          >
                            {matched.currentStock}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            {matched.unit}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.qtyToBuy == null ? (
                        <span className="text-xs italic text-muted-foreground">
                          review
                        </span>
                      ) : r.qtyToBuy === 0 ? (
                        <span className="text-sm font-semibold text-chart-2">
                          0
                        </span>
                      ) : (
                        <span className="text-base font-bold text-destructive">
                          {r.qtyToBuy}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className={meta.rowClass}>
                      <TableCell colSpan={8} className="text-sm">
                        <div className="space-y-2 py-1">
                          <p className="text-xs text-muted-foreground">
                            {r.note}
                          </p>

                          {r.candidates.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Kandidat dari fuzzy match
                              </p>
                              {r.candidates.map((c) => (
                                <Link
                                  key={c.id}
                                  href={`/parts?search=${encodeURIComponent(c.partCode)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center justify-between gap-3 rounded-md border bg-background p-2.5 hover:bg-accent/40"
                                >
                                  <div className="flex items-start gap-2">
                                    <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <div className="leading-tight">
                                      <p className="text-sm font-medium">
                                        {c.partName}
                                      </p>
                                      <p className="tabular-nums text-xs text-muted-foreground">
                                        {c.partCode} · {c.maker} ·{" "}
                                        {c.storageAddr}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="tabular-nums text-xs">
                                    Stok{" "}
                                    <span className="font-semibold text-foreground">
                                      {c.currentStock}
                                    </span>{" "}
                                    {c.unit}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const palette = {
    neutral: "border-border bg-card text-foreground",
    success: "border-chart-2/30 bg-chart-2/5 text-chart-2",
    warning: "border-chart-3/30 bg-chart-3/5 text-chart-3",
    danger: "border-destructive/30 bg-destructive/5 text-destructive",
    info: "border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300",
  } as const;
  return (
    <div className={cn("rounded-lg border p-3 transition-colors", palette[tone])}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-3.5 w-3.5 opacity-70" />
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone?: "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "border-chart-2/40 text-chart-2"
      : tone === "warning"
        ? "border-chart-3/40 text-chart-3"
        : tone === "danger"
          ? "border-destructive/40 text-destructive"
          : tone === "info"
            ? "border-sky-500/40 text-sky-700 dark:text-sky-300"
            : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : cn(
              "bg-background hover:bg-accent/40",
              toneClass || "text-muted-foreground",
            ),
      )}
    >
      {children}
    </button>
  );
}
