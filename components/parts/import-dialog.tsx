"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileWarning,
  Filter,
  Info,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
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
import {
  getImportContext,
  importParts,
  type ImportRow,
} from "@/lib/actions/parts.actions";
import { formatStorageAddr, generateBarcode } from "@/lib/utils/barcode";

// ─────────────────────────────────────────────────────────────────────────────
// Validation rules
// ─────────────────────────────────────────────────────────────────────────────

const VALID_TYPES = ["Electrical", "Mechanical", "Fabrication"] as const;
const VALID_CLASSES = [
  "consumable",
  "existing_project",
  "new_part",
] as const;
const VALID_UNITS = [
  "pcs",
  "set",
  "mtr",
  "kg",
  "lbr",
  "btg",
  "rol",
  "pak",
] as const;
const VALID_STORAGE = ["A", "B"] as const;

interface RowIssue {
  field: string;
  level: "error" | "warning";
  message: string;
}

interface ParsedRow extends ImportRow {
  /** 1-based excel row number (after the header). */
  rowNo: number;
  status: "valid" | "warning" | "error";
  issues: RowIssue[];
}

/** Header aliases — case-insensitive, ignores spaces/underscores/dashes. */
const HEADER_ALIASES: Record<keyof ImportRow, string[]> = {
  partCode: ["partcode", "code", "kode"],
  partName: ["partname", "name", "nama"],
  maker: ["maker", "merk", "brand"],
  type: ["type", "tipe"],
  partClass: ["source", "partclass", "klasifikasi"],
  category: ["category", "kategori", "subcategory"],
  unit: ["unit", "satuan"],
  price: ["price", "harga"],
  initialStock: ["initialstock", "stockawal", "stokawal", "stock", "stok"],
  minStock: ["minstock", "min", "minimum"],
  stdStock: ["stdstock", "std", "standard"],
  maxStock: ["maxstock", "max", "maksimum"],
  description: ["description", "deskripsi"],
  remarks: ["remarks", "catatan"],
  storageType: ["lemari", "storagetype"],
  storageNumber: ["storagenumber", "nomorlemari", "number"],
  storageBox: ["storagebox", "box"],
  storageBoxKecil: ["storageboxkecil", "boxkecil", "subbox"],
};

function normHeader(s: string): string {
  return s.toLowerCase().replace(/[\s_\-]/g, "");
}

function getCell(
  row: Record<string, unknown>,
  field: keyof ImportRow,
): unknown {
  const aliases = HEADER_ALIASES[field];
  for (const k of Object.keys(row)) {
    const norm = normHeader(k);
    if (aliases.some((a) => norm === a || norm.includes(a))) return row[k];
  }
  return undefined;
}

function asString(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function asNumberOrUndef(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-row validation
// ─────────────────────────────────────────────────────────────────────────────

interface ValidateCtx {
  takenCodes: Set<string>;
  fileCodes: Set<string>;
  usedBarcodes: Set<string>;
  usedAddresses: Set<string>;
  fileBarcodes: Set<string>;
}

function validateRow(
  r: ImportRow,
  rowNo: number,
  ctx: ValidateCtx,
): ParsedRow {
  const issues: RowIssue[] = [];
  const required = (
    field: string,
    value: unknown,
    label: string,
  ): boolean => {
    if (value == null || value === "" || (typeof value === "number" && Number.isNaN(value))) {
      issues.push({
        field,
        level: "error",
        message: `${label} wajib diisi`,
      });
      return false;
    }
    return true;
  };

  // ── Required strings
  const code = r.partCode.trim();
  if (required("partCode", code, "Part Code")) {
    if (code.length > 50) {
      issues.push({
        field: "partCode",
        level: "error",
        message: "Part Code lebih dari 50 karakter",
      });
    } else if (ctx.takenCodes.has(code.toUpperCase())) {
      issues.push({
        field: "partCode",
        level: "error",
        message: "Part Code sudah ada di database",
      });
    } else if (ctx.fileCodes.has(code.toUpperCase())) {
      issues.push({
        field: "partCode",
        level: "error",
        message: "Part Code duplikat di file ini",
      });
    }
  }
  if (required("partName", r.partName.trim(), "Part Name")) {
    if (r.partName.length > 200) {
      issues.push({
        field: "partName",
        level: "error",
        message: "Part Name lebih dari 200 karakter",
      });
    }
  }
  required("maker", r.maker.trim(), "Maker");
  required("category", r.category?.trim(), "Category");

  // ── Required enums
  if (required("type", r.type, "Type")) {
    if (!VALID_TYPES.includes(r.type as (typeof VALID_TYPES)[number])) {
      issues.push({
        field: "type",
        level: "error",
        message: `Type "${r.type}" harus salah satu: Electrical / Mechanical / Fabrication`,
      });
    }
  }
  if (required("partClass", r.partClass, "Source")) {
    if (
      !VALID_CLASSES.includes(r.partClass as (typeof VALID_CLASSES)[number])
    ) {
      issues.push({
        field: "partClass",
        level: "error",
        message: `Source "${r.partClass}" harus salah satu: consumable / existing_project / new_part`,
      });
    }
  }
  if (required("unit", r.unit, "Unit")) {
    if (!VALID_UNITS.includes(r.unit as (typeof VALID_UNITS)[number])) {
      issues.push({
        field: "unit",
        level: "error",
        message: `Unit "${r.unit}" harus salah satu: pcs / set / mtr / kg / lbr / btg / rol / pak`,
      });
    }
  }

  // ── Required numerics
  const validNum = (
    field: keyof ImportRow,
    label: string,
    val: unknown,
  ): number | null => {
    if (val == null || val === "" || (typeof val === "number" && Number.isNaN(val))) {
      issues.push({
        field,
        level: "error",
        message: `${label} wajib diisi`,
      });
      return null;
    }
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0) {
      issues.push({
        field,
        level: "error",
        message: `${label} harus angka ≥ 0`,
      });
      return null;
    }
    return n;
  };

  validNum("initialStock", "Stock", r.initialStock);
  const minN = validNum("minStock", "Min Stock", r.minStock);
  const stdN = validNum("stdStock", "Std Stock", r.stdStock);
  const maxN = validNum("maxStock", "Max Stock", r.maxStock);

  // Threshold ordering
  if (minN != null && stdN != null && stdN < minN) {
    issues.push({
      field: "stdStock",
      level: "error",
      message: "Std Stock harus ≥ Min Stock",
    });
  }
  if (stdN != null && maxN != null && maxN < stdN) {
    issues.push({
      field: "maxStock",
      level: "error",
      message: "Max Stock harus ≥ Std Stock",
    });
  }

  // ── Optional: price (default 0)
  if (r.price != null && r.price !== undefined) {
    if (Number.isNaN(r.price) || (r.price as number) < 0) {
      issues.push({
        field: "price",
        level: "error",
        message: "Price harus angka ≥ 0",
      });
    }
  }

  // ── Optional: storage location (all-4-or-none)
  const sType = (r.storageType ?? "").toString().trim().toUpperCase();
  const sNum = r.storageNumber;
  const sBox = r.storageBox;
  const sBK = r.storageBoxKecil;
  const hasAnyLoc =
    !!sType || sNum != null || sBox != null || sBK != null;
  const hasAllLoc =
    !!sType && sNum != null && sBox != null && sBK != null;

  if (hasAnyLoc && !hasAllLoc) {
    issues.push({
      field: "storageType",
      level: "error",
      message:
        "Lokasi harus diisi lengkap (Lemari, Number, Box, Box Kecil) atau dikosongkan semua",
    });
  }
  if (sType && !VALID_STORAGE.includes(sType as (typeof VALID_STORAGE)[number])) {
    issues.push({
      field: "storageType",
      level: "error",
      message: `Lemari "${r.storageType}" harus A (Lemari) atau B (Rak)`,
    });
  }
  if (hasAllLoc && sNum != null && sNum <= 0) {
    issues.push({
      field: "storageNumber",
      level: "error",
      message: "Storage Number harus > 0",
    });
  }
  if (hasAllLoc && sBox != null && sBox <= 0) {
    issues.push({
      field: "storageBox",
      level: "error",
      message: "Box harus > 0",
    });
  }
  if (hasAllLoc && sBK != null && sBK <= 0) {
    issues.push({
      field: "storageBoxKecil",
      level: "error",
      message: "Box Kecil harus > 0",
    });
  }

  // Barcode / address conflict
  if (
    hasAllLoc &&
    sType &&
    sNum != null &&
    sNum > 0 &&
    sBox != null &&
    sBox > 0 &&
    sBK != null &&
    sBK > 0 &&
    VALID_STORAGE.includes(sType as (typeof VALID_STORAGE)[number])
  ) {
    const barcode = generateBarcode(sType, sNum, sBox, sBK);
    const addr = formatStorageAddr(sType, sNum, sBox, sBK);
    if (ctx.usedBarcodes.has(barcode) || ctx.usedAddresses.has(addr)) {
      issues.push({
        field: "storageType",
        level: "error",
        message: `Lokasi ${addr} sudah dipakai part aktif lain`,
      });
    } else if (ctx.fileBarcodes.has(barcode)) {
      issues.push({
        field: "storageType",
        level: "error",
        message: `Lokasi ${addr} duplikat di file ini`,
      });
    }
  }

  // Warning for price missing (will default to 0)
  if (r.price == null) {
    issues.push({
      field: "price",
      level: "warning",
      message: "Price kosong → default Rp 0",
    });
  }

  const hasError = issues.some((i) => i.level === "error");
  const hasWarn = issues.some((i) => i.level === "warning");
  return {
    ...r,
    storageType: sType || undefined,
    rowNo,
    issues,
    status: hasError ? "error" : hasWarn ? "warning" : "valid",
  };
}

/** Build & trigger a download of a starter template Excel file. */
function downloadTemplate() {
  const data = [
    {
      "Part Code": "MIA-EL-100",
      "Part Name": "Sensor Proximity M12",
      Maker: "Keyence",
      Type: "Electrical",
      Source: "consumable",
      Category: "Sensor",
      Unit: "pcs",
      Stock: 5,
      "Min Stock": 5,
      "Std Stock": 10,
      "Max Stock": 15,
      Price: 1200000,
      Lemari: "A",
      "Storage Number": 1,
      Box: 1,
      "Box Kecil": 5,
      Description: "Sensor proximity untuk line assembly",
      Remarks: "",
    },
    {
      "Part Code": "MIA-ME-101",
      "Part Name": "Bearing SKF 6205",
      Maker: "SKF",
      Type: "Mechanical",
      Source: "existing_project",
      Category: "Bearing",
      Unit: "pcs",
      Stock: 20,
      "Min Stock": 10,
      "Std Stock": 20,
      "Max Stock": 30,
      Price: 120000,
      Lemari: "",
      "Storage Number": "",
      Box: "",
      "Box Kecil": "",
      Description: "",
      Remarks: "Lokasi diisi belakangan via Assign Lokasi",
    },
  ];
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Master Part Template");
  XLSX.writeFile(book, "template-master-part.xlsx");
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type Step = "upload" | "preview" | "result";
type FilterStatus = "all" | "valid" | "warning" | "error";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Import parts from Excel/CSV — upload → validate → preview → import. */
export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [busy, setBusy] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState({ created: 0, skipped: 0 });
  const [ctx, setCtx] = useState({
    existingCodes: new Set<string>(),
    usedBarcodes: new Set<string>(),
    usedAddresses: new Set<string>(),
  });

  useEffect(() => {
    if (!open) return;
    getImportContext().then((c) =>
      setCtx({
        existingCodes: new Set(c.existingCodes.map((s) => s.toUpperCase())),
        usedBarcodes: new Set(c.usedBarcodes),
        usedAddresses: new Set(c.usedAddresses),
      }),
    );
  }, [open]);

  const reset = () => {
    setStep("upload");
    setFileName("");
    setRows([]);
    setSelected(new Set());
    setFilter("all");
    setResult({ created: 0, skipped: 0 });
  };
  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setParsing(true);
      try {
        const wb = XLSX.read(await file.arrayBuffer());
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (json.length === 0) {
          toast.error("File kosong — tidak ada baris untuk diimpor");
          setParsing(false);
          return;
        }
        if (json.length > 500) {
          toast.warning(
            `File berisi ${json.length} baris — hanya 500 pertama yang diproses`,
          );
        }

        const fileCodes = new Set<string>();
        const fileBarcodes = new Set<string>();
        const validateCtx: ValidateCtx = {
          takenCodes: ctx.existingCodes,
          fileCodes,
          usedBarcodes: ctx.usedBarcodes,
          usedAddresses: ctx.usedAddresses,
          fileBarcodes,
        };

        const parsed: ParsedRow[] = json.slice(0, 500).map((r, i) => {
          const row: ImportRow = {
            partCode: asString(getCell(r, "partCode")),
            partName: asString(getCell(r, "partName")),
            maker: asString(getCell(r, "maker")),
            type: asString(getCell(r, "type")) || undefined,
            partClass: asString(getCell(r, "partClass")) || undefined,
            category: asString(getCell(r, "category")) || undefined,
            unit: asString(getCell(r, "unit")) || undefined,
            price: asNumberOrUndef(getCell(r, "price")),
            initialStock: asNumberOrUndef(getCell(r, "initialStock")),
            minStock: asNumberOrUndef(getCell(r, "minStock")),
            stdStock: asNumberOrUndef(getCell(r, "stdStock")),
            maxStock: asNumberOrUndef(getCell(r, "maxStock")),
            description: asString(getCell(r, "description")) || undefined,
            remarks: asString(getCell(r, "remarks")) || undefined,
            storageType:
              asString(getCell(r, "storageType")).toUpperCase() || undefined,
            storageNumber: asNumberOrUndef(getCell(r, "storageNumber")),
            storageBox: asNumberOrUndef(getCell(r, "storageBox")),
            storageBoxKecil: asNumberOrUndef(getCell(r, "storageBoxKecil")),
          };

          const validated = validateRow(row, i + 2, validateCtx);
          if (row.partCode) fileCodes.add(row.partCode.toUpperCase());
          // Track barcodes already claimed by previous rows in this file.
          if (
            validated.storageType &&
            row.storageNumber &&
            row.storageBox &&
            row.storageBoxKecil
          ) {
            fileBarcodes.add(
              generateBarcode(
                validated.storageType,
                row.storageNumber,
                row.storageBox,
                row.storageBoxKecil,
              ),
            );
          }
          return validated;
        });

        const recognised = parsed.some(
          (p) => p.partCode || p.partName || p.maker,
        );
        if (!recognised) {
          toast.error(
            "Header kolom tidak dikenali. Download template untuk format yang benar.",
          );
          setParsing(false);
          return;
        }

        setFileName(file.name);
        setRows(parsed);
        setSelected(
          new Set(
            parsed
              .filter((p) => p.status !== "error")
              .map((p) => p.rowNo),
          ),
        );
        setStep("preview");
      } catch {
        toast.error(
          "Gagal membaca file — pastikan format .xlsx, .xls, atau .csv",
        );
      } finally {
        setParsing(false);
      }
    },
    [ctx],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const stats = useMemo(() => {
    const valid = rows.filter((r) => r.status === "valid").length;
    const warning = rows.filter((r) => r.status === "warning").length;
    const error = rows.filter((r) => r.status === "error").length;
    return { total: rows.length, valid, warning, error };
  }, [rows]);

  const visibleRows = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  const toggleRow = (rowNo: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(rowNo)) next.delete(rowNo);
      else next.add(rowNo);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((s) => {
      const next = new Set(s);
      const importable = visibleRows.filter((r) => r.status !== "error");
      const allOn = importable.every((r) => next.has(r.rowNo));
      if (allOn) importable.forEach((r) => next.delete(r.rowNo));
      else importable.forEach((r) => next.add(r.rowNo));
      return next;
    });
  };

  const selectedCount = useMemo(
    () => rows.filter((r) => selected.has(r.rowNo)).length,
    [rows, selected],
  );

  const runImport = async () => {
    const payload = rows.filter(
      (r) => selected.has(r.rowNo) && r.status !== "error",
    );
    if (payload.length === 0) {
      toast.error("Tidak ada baris valid yang dipilih");
      return;
    }
    setBusy(true);
    const res = await importParts(payload);
    setBusy(false);
    if (res.ok) {
      setResult(res.data);
      setStep("result");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : close())}>
      <DialogContent
        className="flex max-h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b px-6 pb-4 pt-6 text-left">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {step === "upload" && "Import Part dari Excel"}
                {step === "preview" && "Preview & Validasi Data"}
                {step === "result" && "Hasil Import"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {step === "upload" &&
                  "Upload file .xlsx / .xls / .csv. Setiap baris akan divalidasi sebelum diimpor."}
                {step === "preview" && (
                  <>
                    <FileSpreadsheet className="mr-1 inline h-3 w-3" />
                    {fileName} · {stats.total} baris
                  </>
                )}
                {step === "result" && "Ringkasan hasil import."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "upload" && (
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

          {step === "preview" && (
            <div className="space-y-4">
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

              <div className="flex flex-wrap items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <FilterPill
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                >
                  Semua · {stats.total}
                </FilterPill>
                <FilterPill
                  active={filter === "valid"}
                  onClick={() => setFilter("valid")}
                  tone="success"
                >
                  Valid · {stats.valid}
                </FilterPill>
                <FilterPill
                  active={filter === "warning"}
                  onClick={() => setFilter("warning")}
                  tone="warning"
                >
                  Warning · {stats.warning}
                </FilterPill>
                <FilterPill
                  active={filter === "error"}
                  onClick={() => setFilter("error")}
                  tone="danger"
                >
                  Error · {stats.error}
                </FilterPill>
                <div className="ml-auto text-xs text-muted-foreground">
                  {selectedCount} dari {stats.total} baris terpilih
                </div>
              </div>

              {stats.error > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-xs">
                    <strong className="text-destructive">
                      {stats.error} baris bermasalah
                    </strong>{" "}
                    akan dilewati. Hover ke ikon status pada setiap baris untuk
                    detail kesalahan.
                  </p>
                </div>
              )}

              <PreviewTable
                rows={visibleRows}
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAllVisible}
              />
            </div>
          )}

          {step === "result" && (
            <ResultStep
              created={result.created}
              skipped={result.skipped}
              total={stats.total}
            />
          )}
        </div>

        <div className="flex items-center gap-2 border-t bg-muted/20 px-6 py-3">
          {step === "upload" && (
            <>
              <Button variant="ghost" onClick={close}>
                Batal
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-1.5 h-4 w-4" />
                Download Template
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="ghost" onClick={close}>
                Batal
              </Button>
              <Button variant="outline" onClick={reset}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Ganti File
              </Button>
              <div className="flex-1" />
              <Button
                disabled={busy || selectedCount === 0}
                onClick={runImport}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                {busy ? "Mengimpor…" : `Import ${selectedCount} Part`}
              </Button>
            </>
          )}
          {step === "result" && (
            <>
              <div className="flex-1" />
              <Button onClick={close}>Selesai</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
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
                : "Drag & drop file atau klik untuk browse"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            .xlsx, .xls, atau .csv · maksimal 500 baris per import
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FileCheck2 className="h-3.5 w-3.5" />
            Kolom yang Dikenali
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Wajib (11):</strong> Part Code,
            Part Name, Maker, Type, Source, Category, Unit, Stock, Min Stock,
            Std Stock, Max Stock
            <br />
            <strong className="text-foreground">Opsional:</strong> Price
            (default Rp 0), Lemari, Storage Number, Box, Box Kecil, Description,
            Remarks
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            Aturan Penting
          </div>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            <li>
              • Type: <code>Electrical / Mechanical / Fabrication</code>
            </li>
            <li>
              • Source: <code>consumable / existing_project / new_part</code>
            </li>
            <li>
              • Unit: <code>pcs / set / mtr / kg / lbr / btg / rol / pak</code>
            </li>
            <li>
              • Min ≤ Std ≤ Max ; Lokasi: isi lengkap atau kosong semua
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
              untuk format yang sudah benar
            </li>
          </ul>
        </div>
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
    importable.length > 0 && importable.every((r) => selected.has(r.rowNo));

  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-md border">
        <div className="max-h-[360px] overflow-auto">
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
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Min</TableHead>
                <TableHead className="text-right">Std</TableHead>
                <TableHead className="text-right">Max</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Lokasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const isError = r.status === "error";
                const isWarn = r.status === "warning";
                const isOn = selected.has(r.rowNo);
                const locText =
                  r.storageType &&
                  r.storageNumber &&
                  r.storageBox &&
                  r.storageBoxKecil
                    ? formatStorageAddr(
                        r.storageType,
                        r.storageNumber,
                        r.storageBox,
                        r.storageBoxKecil,
                      )
                    : "—";
                return (
                  <TableRow
                    key={r.rowNo}
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
                        onCheckedChange={() => onToggleRow(r.rowNo)}
                      />
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {r.rowNo}
                    </TableCell>
                    <TableCell>
                      <StatusIcon row={r} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <Cell value={r.partCode} field="partCode" row={r} />
                    </TableCell>
                    <TableCell>
                      <Cell value={r.partName} field="partName" row={r} />
                    </TableCell>
                    <TableCell>
                      <Cell value={r.maker || "—"} field="maker" row={r} />
                    </TableCell>
                    <TableCell>
                      <Cell value={r.type || "—"} field="type" row={r} />
                    </TableCell>
                    <TableCell>
                      <Cell
                        value={r.partClass || "—"}
                        field="partClass"
                        row={r}
                      />
                    </TableCell>
                    <TableCell>
                      <Cell
                        value={r.category || "—"}
                        field="category"
                        row={r}
                      />
                    </TableCell>
                    <TableCell>
                      <Cell value={r.unit || "—"} field="unit" row={r} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Cell
                        value={r.initialStock ?? "—"}
                        field="initialStock"
                        row={r}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Cell
                        value={r.minStock ?? "—"}
                        field="minStock"
                        row={r}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Cell
                        value={r.stdStock ?? "—"}
                        field="stdStock"
                        row={r}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Cell
                        value={r.maxStock ?? "—"}
                        field="maxStock"
                        row={r}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Cell
                        value={r.price == null ? "Rp 0" : `Rp ${r.price}`}
                        field="price"
                        row={r}
                      />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <Cell value={locText} field="storageType" row={r} />
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

function StatusIcon({ row }: { row: ParsedRow }) {
  const issues = row.issues;
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
          {issues.map((iss, i) => (
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

function Cell({
  value,
  field,
  row,
}: {
  value: React.ReactNode;
  field: string;
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

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "neutral" | "success" | "warning" | "danger";
}) {
  const palette = {
    neutral: "border-border bg-card text-foreground",
    success: "border-chart-2/30 bg-chart-2/5 text-chart-2",
    warning: "border-chart-3/30 bg-chart-3/5 text-chart-3",
    danger: "border-destructive/30 bg-destructive/5 text-destructive",
  } as const;
  return (
    <div
      className={cn("rounded-lg border p-3 transition-colors", palette[tone])}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-3.5 w-3.5 opacity-70" />
      </div>
      <p className="mt-1 tabular-nums text-2xl font-bold tabular-nums">{value}</p>
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
  tone?: "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "border-chart-2/40 text-chart-2"
      : tone === "warning"
        ? "border-chart-3/40 text-chart-3"
        : tone === "danger"
          ? "border-destructive/40 text-destructive"
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

function ResultStep({
  created,
  skipped,
  total,
}: {
  created: number;
  skipped: number;
  total: number;
}) {
  const success = skipped === 0;
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div
        className={cn(
          "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
          success
            ? "bg-chart-2/15 text-chart-2"
            : "bg-chart-3/15 text-chart-3",
        )}
      >
        {success ? (
          <CheckCircle2 className="h-9 w-9" />
        ) : (
          <AlertTriangle className="h-9 w-9" />
        )}
      </div>
      <p className="text-lg font-semibold">
        {success ? "Import Berhasil" : "Import Selesai dengan Catatan"}
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        <strong className="text-chart-2">{created}</strong> part berhasil
        ditambahkan
        {skipped > 0 && (
          <>
            , <strong className="text-chart-3">{skipped}</strong> dilewati
            (duplikat atau tidak valid)
          </>
        )}
        .
      </p>
      <div className="mt-5 grid w-full max-w-sm grid-cols-3 gap-2">
        <div className="rounded-md border bg-card p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Diproses
          </p>
          <p className="mt-0.5 tabular-nums text-xl font-bold tabular-nums">
            {total}
          </p>
        </div>
        <div className="rounded-md border border-chart-2/30 bg-chart-2/5 p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-chart-2">
            Berhasil
          </p>
          <p className="mt-0.5 tabular-nums text-xl font-bold tabular-nums text-chart-2">
            {created}
          </p>
        </div>
        <div className="rounded-md border border-chart-3/30 bg-chart-3/5 p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-chart-3">
            Dilewati
          </p>
          <p className="mt-0.5 tabular-nums text-xl font-bold tabular-nums text-chart-3">
            {skipped}
          </p>
        </div>
      </div>
    </div>
  );
}
