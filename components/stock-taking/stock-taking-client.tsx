"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  Filter,
  HelpCircle,
  History,
  Layers,
  RefreshCw,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useStockTakingDraft } from "@/lib/hooks/use-stock-taking-draft";
import type { PartType, PartWithStock } from "@/lib/types";
import { StockTakingExportDialog } from "./stock-taking-export-dialog";
import {
  StockTakingTable,
  type StockTakingTableRow,
} from "./stock-taking-table";

interface StockTakingClientProps {
  rows: PartWithStock[];
  auditorLabel: string;
}

/** Audit shell — toolbar, KPI strip, draft banner, sticky-header table. */
export function StockTakingClient({
  rows,
  auditorLabel,
}: StockTakingClientProps) {
  const { actuals, setActual, clear, savedAt, mounted } =
    useStockTakingDraft();

  const [search, setSearch] = useState("");
  const [storage, setStorage] = useState<string>("all");
  const [type, setType] = useState<"all" | PartType>("all");
  const [status, setStatus] = useState<"all" | "ok" | "ng" | "blank">("all");
  const [exportOpen, setExportOpen] = useState(false);

  // ── Derived rows with audit values ────────────────────────────────────────
  const enriched: StockTakingTableRow[] = useMemo(
    () =>
      rows.map((part) => {
        const raw = actuals[part.id] ?? "";
        const trimmed = raw.trim();
        const actual = trimmed === "" ? null : Number(trimmed);
        const diff =
          actual === null || Number.isNaN(actual)
            ? null
            : actual - part.currentStock;
        return { part, actualRaw: raw, actual, diff };
      }),
    [rows, actuals],
  );

  // ── Filter dropdown option lists ──────────────────────────────────────────
  const storageOptions = useMemo(() => {
    const groups = new Set<string>();
    for (const r of rows) {
      if (r.storageType && r.storageNumber != null)
        groups.add(`${r.storageType}-${r.storageNumber}`);
    }
    return [...groups].sort();
  }, [rows]);

  // ── Visible (filtered) rows ───────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = enriched;
    if (storage !== "all") {
      list = list.filter(
        (r) =>
          `${r.part.storageType}-${r.part.storageNumber}` === storage,
      );
    }
    if (type !== "all") {
      list = list.filter((r) => r.part.type === type);
    }
    if (status !== "all") {
      list = list.filter((r) => {
        if (status === "blank") return r.diff === null;
        if (status === "ok") return r.diff === 0;
        return r.diff !== null && r.diff !== 0; // ng
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        [r.part.partName, r.part.partCode, r.part.maker, r.part.storageAddr]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [enriched, storage, type, status, search]);

  // ── Summary counts (over full pool, not just visible) ─────────────────────
  const counts = useMemo(() => {
    let filled = 0;
    let ok = 0;
    let ng = 0;
    for (const r of enriched) {
      if (r.diff === null) continue;
      filled++;
      if (r.diff === 0) ok++;
      else ng++;
    }
    return {
      total: enriched.length,
      filled,
      ok,
      ng,
      remaining: enriched.length - filled,
    };
  }, [enriched]);

  const progress =
    counts.total === 0 ? 0 : Math.round((counts.filled / counts.total) * 100);

  // ── Active filter chips ───────────────────────────────────────────────────
  const chips: { key: string; label: string; onClear: () => void }[] = [];
  if (storage !== "all")
    chips.push({
      key: "storage",
      label: `Lokasi: ${storage}`,
      onClear: () => setStorage("all"),
    });
  if (type !== "all")
    chips.push({
      key: "type",
      label: `Type: ${type}`,
      onClear: () => setType("all"),
    });
  if (status !== "all")
    chips.push({
      key: "status",
      label: `Status: ${
        status === "ok" ? "OK" : status === "ng" ? "NG" : "Belum"
      }`,
      onClear: () => setStatus("all"),
    });
  if (search.trim())
    chips.push({
      key: "search",
      label: `"${search.trim()}"`,
      onClear: () => setSearch(""),
    });
  const clearAll = () => {
    setStorage("all");
    setType("all");
    setStatus("all");
    setSearch("");
  };

  const showDraftBanner = mounted && savedAt !== null && counts.filled > 0;

  return (
    <>
      {/* Draft banner */}
      {showDraftBanner && (
        <DraftBanner
          savedAt={savedAt!}
          filled={counts.filled}
          total={counts.total}
          onDiscard={clear}
        />
      )}

      {/* Audit Progress strip */}
      <div className="mb-4 rounded-lg border bg-card p-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <SummaryChip
            icon={Layers}
            label="Total"
            value={counts.total}
            tone="neutral"
          />
          <SummaryChip
            icon={ClipboardList}
            label="Sudah Diaudit"
            value={counts.filled}
            tone="info"
          />
          <SummaryChip
            icon={CheckCircle2}
            label="OK"
            value={counts.ok}
            tone="success"
          />
          <SummaryChip
            icon={AlertTriangle}
            label="NG (Selisih)"
            value={counts.ng}
            tone="warning"
          />
          <SummaryChip
            icon={HelpCircle}
            label="Belum"
            value={counts.remaining}
            tone="muted"
          />
          <div className="ml-auto flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
            <span>{progress}% selesai</span>
          </div>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kode, maker, lokasi…"
            className="h-10 rounded-lg pl-9 text-sm"
          />
        </div>

        <Select value={storage} onValueChange={setStorage}>
          <SelectTrigger
            className={cn(
              "h-10 w-[150px] rounded-lg text-sm",
              storage !== "all" && "border-primary text-primary",
            )}
          >
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

        <Select
          value={type}
          onValueChange={(v) => setType(v as "all" | PartType)}
        >
          <SelectTrigger
            className={cn(
              "h-10 w-[140px] rounded-lg text-sm",
              type !== "all" && "border-primary text-primary",
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Type</SelectItem>
            <SelectItem value="Electrical">Electrical</SelectItem>
            <SelectItem value="Mechanical">Mechanical</SelectItem>
            <SelectItem value="Fabrication">Fabrication</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(v) =>
            setStatus(v as "all" | "ok" | "ng" | "blank")
          }
        >
          <SelectTrigger
            className={cn(
              "h-10 w-[140px] rounded-lg text-sm",
              status !== "all" && "border-primary text-primary",
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="ng">NG (Selisih)</SelectItem>
            <SelectItem value="blank">Belum Diaudit</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {counts.filled > 0 && (
            <Button
              variant="outline"
              className="h-10 rounded-lg text-sm"
              onClick={() => {
                if (
                  confirm(
                    `Buang draft? ${counts.filled} baris yang sudah diisi akan dihapus.`,
                  )
                )
                  clear();
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button
            className="h-10 rounded-lg text-sm"
            onClick={() => setExportOpen(true)}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onClear}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/70"
            >
              {c.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="px-2 text-xs font-medium text-primary hover:underline"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Audit table */}
      <StockTakingTable
        rows={visible}
        onActualChange={setActual}
        startIndex={0}
      />

      {/* Export dialog */}
      <StockTakingExportDialog
        key={`export-${exportOpen ? "open" : "closed"}`}
        open={exportOpen}
        onOpenChange={setExportOpen}
        rows={visible}
        auditorLabel={auditorLabel}
        onDiscardDraft={clear}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** "Draft tersimpan X menit lalu — Lanjutkan / Buang" banner. */
function DraftBanner({
  savedAt,
  filled,
  total,
  onDiscard,
}: {
  savedAt: number;
  filled: number;
  total: number;
  onDiscard: () => void;
}) {
  // Refresh "X menit lalu" every minute while the banner is mounted. Reading
  // Date.now() in render itself would be impure — we keep it inside an effect
  // and a setInterval. The initial setNow corrects the SSR-mismatch where the
  // first paint shows `savedAt - savedAt = 0`.
  const [now, setNow] = useState(savedAt);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const minutesAgo = Math.max(0, Math.round((now - savedAt) / 60000));
  const ago =
    minutesAgo === 0
      ? "barusan"
      : minutesAgo === 1
        ? "1 menit lalu"
        : minutesAgo < 60
          ? `${minutesAgo} menit lalu`
          : `${Math.round(minutesAgo / 60)} jam lalu`;
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-chart-1/30 bg-chart-1/5 p-3">
      <History className="mt-0.5 h-4 w-4 shrink-0 text-chart-1" />
      <div className="flex-1 text-xs">
        <p className="font-semibold text-foreground">
          Draft audit dipulihkan
        </p>
        <p className="mt-0.5 text-muted-foreground">
          {filled} dari {total} baris sudah diisi · tersimpan otomatis{" "}
          {ago}.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => {
          if (
            confirm(
              `Buang draft? ${filled} baris yang sudah diisi akan dihapus.`,
            )
          )
            onDiscard();
        }}
      >
        <RefreshCw className="mr-1 h-3 w-3" />
        Buang
      </Button>
    </div>
  );
}

/** Single colored chip in the Audit Progress strip. */
function SummaryChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "neutral" | "info" | "success" | "warning" | "muted";
}) {
  const palette = {
    neutral: "text-foreground",
    info: "text-chart-1",
    success: "text-chart-2",
    warning: "text-chart-3",
    muted: "text-muted-foreground",
  } as const;
  return (
    <span className="flex items-center gap-1.5">
      <Icon className={cn("h-3.5 w-3.5", palette[tone])} />
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular-nums", palette[tone])}>
        {value}
      </span>
    </span>
  );
}
