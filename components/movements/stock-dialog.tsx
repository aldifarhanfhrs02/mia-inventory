"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Package,
  Search,
  TrendingUp,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreatableSelect } from "@/components/shared/creatable-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createMovement,
  getPartByIdentifier,
  lookupRequestor,
} from "@/lib/actions/movements.actions";

type FoundPart = Awaited<ReturnType<typeof getPartByIdentifier>>;

interface StockDialogProps {
  mode: "IN" | "OUT" | null;
  onOpenChange: (open: boolean) => void;
  projectOptions: string[];
  inputerLabel: string;
}

/** Section heading with an icon — used inside each card. */
function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

/** Floating, centered Stock IN / OUT dialog. */
export function StockDialog({
  mode,
  onOpenChange,
  projectOptions,
  inputerLabel,
}: StockDialogProps) {
  const router = useRouter();
  const isIn = mode === "IN";

  const [scan, setScan] = useState("");
  const [part, setPart] = useState<FoundPart>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [qty, setQty] = useState("");
  const [requestorNik, setRequestorNik] = useState("");
  const [requestor, setRequestor] = useState<{ name: string } | null>(null);
  const [nikError, setNikError] = useState(false);
  const [project, setProject] = useState("");
  const [projects, setProjects] = useState(projectOptions);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Debounced requestor NIK lookup — setState only runs in the async callback,
  // never synchronously inside the effect body.
  useEffect(() => {
    const key = requestorNik.trim();
    if (!key) return;
    const t = setTimeout(async () => {
      const found = await lookupRequestor(key);
      setRequestor(found ? { name: found.name } : null);
      setNikError(!found && key.length >= 3);
    }, 350);
    return () => clearTimeout(t);
  }, [requestorNik]);

  /** Clear the resolved name/error eagerly when the user empties the field. */
  const updateRequestorNik = (next: string) => {
    setRequestorNik(next);
    if (!next.trim()) {
      setRequestor(null);
      setNikError(false);
    }
  };

  const qtyNum = Number.parseInt(qty, 10) || 0;
  const after = part
    ? isIn
      ? part.currentStock + qtyNum
      : part.currentStock - qtyNum
    : 0;
  const outExceeds = !isIn && part && qtyNum > part.currentStock;
  const canSubmit = !!part && qtyNum > 0 && !!requestor && !outExceeds;

  const handleScan = async () => {
    const key = scan.trim();
    if (!key) return;
    setSearching(true);
    const found = await getPartByIdentifier(key);
    setSearching(false);
    setPart(found);
    setNotFound(!found);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !part || !requestor) return;
    setSaving(true);
    const res = await createMovement({
      partIdentifier: scan.trim(),
      type: isIn ? "IN" : "OUT",
      quantity: qtyNum,
      requestor: requestor.name,
      project: project || undefined,
    });
    setSaving(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const accent = isIn ? "text-chart-2" : "text-chart-4";
  const accentBg = isIn ? "bg-chart-2/15" : "bg-chart-4/15";
  const accentBorder = isIn ? "border-chart-2/40" : "border-chart-4/40";
  const previewBg = isIn ? "bg-chart-2/5" : "bg-chart-4/5";

  return (
    <Dialog open={!!mode} onOpenChange={(o) => (o ? undefined : onOpenChange(false))}>
      <DialogContent
        className="flex max-h-[90vh] w-[95vw] max-w-xl flex-col gap-0 p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* HEADER */}
        <DialogHeader className="border-b px-6 pb-4 pt-6 text-left">
          <div className="flex items-center gap-2">
            <div className={cn("rounded-md p-1.5", accentBg, accent)}>
              {isIn ? (
                <ArrowUp className="h-5 w-5" />
              ) : (
                <ArrowDown className="h-5 w-5" />
              )}
            </div>
            <div>
              <DialogTitle className={cn("text-lg", accent)}>
                Stock {mode}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isIn
                  ? "Catat penambahan stok untuk part aktif. Scan barcode atau ketik Part Code."
                  : "Catat pengambilan stok dari gudang. Stok tidak boleh kurang dari 0."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {done ? (
            // ── Success ─────────────────────────────────────────────
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div
                className={cn(
                  "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
                  accentBg,
                  accent,
                )}
              >
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <p className="text-lg font-semibold">Transaksi Berhasil</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {part?.partName}{" "}
                <span className="tabular-nums text-xs">({part?.partCode})</span>
              </p>
              <div
                className={cn(
                  "mt-4 rounded-lg border px-4 py-3 tabular-nums text-sm",
                  accentBorder,
                  previewBg,
                )}
              >
                <span className="text-muted-foreground">Stok berubah:</span>{" "}
                <span className="font-semibold">{part?.currentStock}</span>{" "}
                → <span className="font-semibold">{after}</span> {part?.unit}{" "}
                <span className={cn("font-bold", accent)}>
                  ({isIn ? "+" : "−"}
                  {qtyNum})
                </span>
              </div>
              <Button className="mt-6" onClick={() => onOpenChange(false)}>
                Selesai
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* STEP 1 — Find part */}
              <section>
                <SectionTitle icon={Search}>1. Cari Part</SectionTitle>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      autoFocus
                      value={scan}
                      onChange={(e) => {
                        setScan(e.target.value);
                        setNotFound(false);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleScan()}
                      placeholder="Scan barcode atau ketik Part Code…"
                      className="pl-8 tabular-nums"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleScan}
                    disabled={!scan.trim() || searching}
                  >
                    {searching ? "Mencari…" : "Cari"}
                  </Button>
                </div>
                {notFound && (
                  <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-xs text-destructive">
                      Part tidak ditemukan atau tidak aktif. Pastikan Part
                      Code / Barcode benar.
                    </p>
                  </div>
                )}

                {/* Part info card */}
                {part && (
                  <div className="mt-3 rounded-lg border bg-card p-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {part.partName}
                        </p>
                        <p className="tabular-nums text-xs text-muted-foreground">
                          {part.partCode} · {part.maker}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Stok
                        </p>
                        <p className="tabular-nums text-lg font-bold tabular-nums">
                          {part.currentStock}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {part.unit}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* STEP 2 — Quantity + Requestor (only when part found) */}
              {part && (
                <>
                  <section>
                    <SectionTitle icon={TrendingUp}>
                      2. Jumlah Transaksi
                    </SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Quantity
                          <span className="ml-0.5 text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="0"
                            className="tabular-nums text-lg font-semibold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {part.unit}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Stok Setelah</Label>
                        <div
                          className={cn(
                            "flex h-10 items-center justify-center rounded-md border px-3 tabular-nums text-lg font-bold tabular-nums",
                            qtyNum > 0
                              ? cn(accent, accentBorder, previewBg)
                              : "text-muted-foreground",
                          )}
                        >
                          {qtyNum > 0 ? (
                            <>
                              {after}
                              <span className="ml-1.5 text-xs font-normal">
                                {part.unit}
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>
                    </div>
                    {qtyNum > 0 && (
                      <div
                        className={cn(
                          "mt-2 rounded-md border px-3 py-2 tabular-nums text-xs",
                          accentBorder,
                          previewBg,
                        )}
                      >
                        <span className="text-muted-foreground">
                          Perubahan:
                        </span>{" "}
                        {part.currentStock} → {after}{" "}
                        <span className={cn("font-bold", accent)}>
                          ({isIn ? "+" : "−"}
                          {qtyNum} {part.unit})
                        </span>
                      </div>
                    )}
                    {outExceeds && (
                      <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <p className="text-xs">
                          <strong className="text-destructive">
                            Quantity melebihi stok!
                          </strong>{" "}
                          <span className="text-muted-foreground">
                            Stok tersedia hanya {part.currentStock} {part.unit}.
                          </span>
                        </p>
                      </div>
                    )}
                  </section>

                  <section>
                    <SectionTitle icon={User}>
                      3. Requestor &amp; Project
                    </SectionTitle>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          NIK Requestor
                          <span className="ml-0.5 text-destructive">*</span>
                        </Label>
                        <Input
                          value={requestorNik}
                          onChange={(e) => updateRequestorNik(e.target.value)}
                          placeholder="Contoh: 24100005"
                          className="tabular-nums"
                        />
                        {requestor && (
                          <div className="flex items-center gap-1.5 rounded-md border border-chart-2/30 bg-chart-2/10 px-2.5 py-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                            <span className="text-xs font-medium text-chart-2">
                              {requestor.name}
                            </span>
                          </div>
                        )}
                        {nikError && (
                          <div className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            <span className="text-xs text-destructive">
                              NIK tidak ditemukan.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Inputer</Label>
                          <Input
                            value={inputerLabel}
                            disabled
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            Project{" "}
                            <span className="text-muted-foreground">
                              (opsional)
                            </span>
                          </Label>
                          <CreatableSelect
                            value={project}
                            onChange={setProject}
                            options={projects}
                            onCreate={(v) => setProjects((p) => [...p, v])}
                            placeholder="— Pilih project —"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* Hint when no part selected yet */}
              {!part && !notFound && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center text-muted-foreground">
                  <Package className="h-8 w-8 opacity-40" />
                  <p className="text-sm font-medium">Belum ada part dipilih</p>
                  <p className="text-xs">
                    Scan barcode atau ketik Part Code di atas, lalu tekan{" "}
                    <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">
                      Enter
                    </kbd>
                    .
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {!done && (
          <div className="flex items-center gap-2 border-t bg-muted/20 px-6 py-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <div className="flex-1" />
            <Button
              disabled={!canSubmit || saving}
              onClick={handleSubmit}
              className={cn(
                isIn
                  ? "bg-chart-2 text-white hover:bg-chart-2/90"
                  : "bg-chart-4 text-white hover:bg-chart-4/90",
              )}
            >
              {isIn ? (
                <ArrowUp className="mr-1.5 h-4 w-4" />
              ) : (
                <ArrowDown className="mr-1.5 h-4 w-4" />
              )}
              {saving ? "Menyimpan…" : `Konfirmasi Stock ${mode}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
