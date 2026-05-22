"use client";

import { ArrowDown, ArrowUp, Check, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreatableSelect } from "@/components/shared/creatable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  createMovement,
  getPartByIdentifier,
  lookupRequestor,
} from "@/lib/actions/movements.actions";

type FoundPart = Awaited<ReturnType<typeof getPartByIdentifier>>;

interface StockSheetProps {
  mode: "IN" | "OUT" | null;
  onOpenChange: (open: boolean) => void;
  projectOptions: string[];
  inputerLabel: string;
}

/** Slide-over Stock IN / OUT transaction form. */
export function StockSheet({
  mode,
  onOpenChange,
  projectOptions,
  inputerLabel,
}: StockSheetProps) {
  const router = useRouter();
  const isIn = mode === "IN";

  const [scan, setScan] = useState("");
  const [part, setPart] = useState<FoundPart>(null);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState("");
  const [requestorNik, setRequestorNik] = useState("");
  const [requestor, setRequestor] = useState<{ name: string } | null>(null);
  const [nikError, setNikError] = useState(false);
  const [project, setProject] = useState("");
  const [projects, setProjects] = useState(projectOptions);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Debounced requestor NIK lookup — setState only runs in the async callback.
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

  const qtyNum = Number.parseInt(qty, 10) || 0;
  const after = part
    ? isIn
      ? part.currentStock + qtyNum
      : part.currentStock - qtyNum
    : 0;
  const outExceeds = !isIn && part && qtyNum > part.currentStock;
  const canSubmit = !!part && qtyNum > 0 && !!requestor && !outExceeds;

  const handleScan = async () => {
    if (!scan.trim()) return;
    const found = await getPartByIdentifier(scan);
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

  return (
    <Sheet open={!!mode} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle className={cn("flex items-center gap-2", accent)}>
            {isIn ? (
              <ArrowUp className="h-5 w-5" />
            ) : (
              <ArrowDown className="h-5 w-5" />
            )}
            Stock {mode}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto px-4 pb-4">
          {done ? (
            <div className="py-10 text-center">
              <Check
                className={cn("mx-auto mb-3 h-12 w-12", accent)}
                strokeWidth={3}
              />
              <p className="font-semibold">Transaksi Berhasil</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {part?.partName}
              </p>
              <p className="mt-3 font-mono">
                {part?.currentStock} → {after} {part?.unit}{" "}
                <span className={cn("font-bold", accent)}>
                  ({isIn ? "+" : "-"}
                  {qtyNum})
                </span>
              </p>
              <Button className="mt-6" onClick={() => onOpenChange(false)}>
                Selesai
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Scan / Cari Part</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={scan}
                      onChange={(e) => {
                        setScan(e.target.value);
                        setNotFound(false);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleScan()}
                      placeholder="Barcode atau Part Code…"
                      className="pl-8"
                    />
                  </div>
                  <Button type="button" onClick={handleScan}>
                    Cari
                  </Button>
                </div>
                {notFound && (
                  <p className="text-xs text-destructive">
                    Part tidak ditemukan atau tidak aktif.
                  </p>
                )}
              </div>

              {part && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-semibold">{part.partName}</p>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Part Code</span>
                      <span className="font-mono">{part.partCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Stock</span>
                      <span className="font-mono font-semibold text-foreground">
                        {part.currentStock} {part.unit}
                      </span>
                    </div>
                  </div>
                  {qtyNum > 0 && (
                    <p
                      className={cn(
                        "mt-2 border-l-2 pl-2 font-mono text-sm",
                        isIn ? "border-chart-2" : "border-chart-4",
                      )}
                    >
                      {part.currentStock} → {after} {part.unit}{" "}
                      <span className={cn("font-bold", accent)}>
                        ({isIn ? "+" : "-"}
                        {qtyNum})
                      </span>
                    </p>
                  )}
                </div>
              )}

              {part && (
                <>
                  <div className="space-y-1.5">
                    <Label>
                      Quantity<span className="text-destructive"> *</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="font-mono"
                    />
                    {outExceeds && (
                      <p className="text-xs text-destructive">
                        Quantity melebihi stok tersedia ({part.currentStock}{" "}
                        {part.unit})
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      NIK Requestor
                      <span className="text-destructive"> *</span>
                    </Label>
                    <Input
                      value={requestorNik}
                      onChange={(e) => setRequestorNik(e.target.value)}
                      placeholder="Contoh: 24100005"
                      className="font-mono"
                    />
                    {requestor && (
                      <p className="rounded-md border border-chart-2/30 bg-chart-2/10 px-2 py-1 text-xs text-chart-2">
                        ✓ {requestor.name}
                      </p>
                    )}
                    {nikError && (
                      <p className="text-xs text-destructive">
                        NIK tidak ditemukan.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Inputer</Label>
                    <Input value={inputerLabel} disabled />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Project</Label>
                    <CreatableSelect
                      value={project}
                      onChange={setProject}
                      options={projects}
                      onCreate={(v) => setProjects((p) => [...p, v])}
                      placeholder="— Pilih project (opsional) —"
                    />
                  </div>

                  <Button
                    className="w-full"
                    disabled={!canSubmit || saving}
                    onClick={handleSubmit}
                  >
                    {saving
                      ? "Menyimpan…"
                      : `Konfirmasi Stock ${mode}`}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
