"use client";

import { AlertTriangle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TypeBadge } from "@/components/shared/type-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createPart } from "@/lib/actions/parts.actions";
import { CreatePartSchema } from "@/lib/validations/parts.schema";
import { generateBarcode, formatStorageAddr } from "@/lib/utils/barcode";
import { formatPrice } from "@/lib/utils/format";
import type { CreatePartInput, PartType } from "@/lib/types";

const EMPTY = {
  partName: "",
  partCode: "",
  maker: "",
  type: "electrical" as PartType,
  category: "",
  unit: "PCS",
  description: "",
  remarks: "",
  price: "",
  minStock: "",
  stdStock: "",
  maxStock: "",
  initialStock: "",
  storageType: "",
  storageNumber: "",
  storageBox: "",
  storageBoxKecil: "",
};
type FormState = typeof EMPTY;

const STEPS = ["Identitas Part", "Lokasi & Stok", "Preview"];
const TYPES: PartType[] = ["electrical", "mechanical", "fabrication"];
const UNITS = ["PCS", "SET", "MTR", "KG", "LBR", "BTG", "ROL", "PAK"];
const numOrU = (s: string): number | undefined =>
  s.trim() === "" ? undefined : Number(s);

interface PartFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usedBarcodes: string[];
  usedAddresses: string[];
}

/** 3-step "Tambah Part" wizard. */
export function PartFormSheet({
  open,
  onOpenChange,
  usedBarcodes,
  usedAddresses,
}: PartFormSheetProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const reset = () => {
    setForm(EMPTY);
    setStep(1);
    setDone(false);
  };
  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const hasAllStorage =
    !!form.storageType &&
    !!form.storageNumber &&
    !!form.storageBox &&
    !!form.storageBoxKecil;
  const storageAddr = hasAllStorage
    ? formatStorageAddr(
        form.storageType,
        Number(form.storageNumber),
        Number(form.storageBox),
        Number(form.storageBoxKecil),
      )
    : "—";
  const barcode = hasAllStorage
    ? generateBarcode(
        form.storageType,
        Number(form.storageNumber),
        Number(form.storageBox),
        Number(form.storageBoxKecil),
      )
    : "—";
  const conflict =
    hasAllStorage &&
    (usedAddresses.includes(storageAddr) || usedBarcodes.includes(barcode));

  const canStep2 =
    form.partName && form.partCode && form.maker && form.category && form.unit;

  const submit = async () => {
    const input: CreatePartInput = {
      partName: form.partName,
      partCode: form.partCode,
      maker: form.maker,
      type: form.type,
      category: form.category,
      unit: form.unit as CreatePartInput["unit"],
      description: form.description || undefined,
      remarks: form.remarks || undefined,
      price: numOrU(form.price),
      minStock: Number(form.minStock || 0),
      stdStock: numOrU(form.stdStock),
      maxStock: numOrU(form.maxStock),
      initialStock: Number(form.initialStock || 0),
      storageType: (form.storageType ||
        undefined) as CreatePartInput["storageType"],
      storageNumber: numOrU(form.storageNumber),
      storageBox: numOrU(form.storageBox),
      storageBoxKecil: numOrU(form.storageBoxKecil),
    };
    const check = CreatePartSchema.safeParse(input);
    if (!check.success) {
      toast.error(check.error.issues[0]?.message ?? "Periksa kembali isian");
      return;
    }
    setSaving(true);
    const res = await createPart(input);
    setSaving(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const labelled = (label: string, required: boolean, node: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {node}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? undefined : close())}>
      <SheetContent
        side="right"
        className="flex w-[480px] flex-col gap-0 sm:max-w-[480px]"
      >
        <SheetHeader>
          <SheetTitle>Tambah Part Baru</SheetTitle>
        </SheetHeader>

        {!done && (
          <div className="flex items-center gap-1 px-4 pb-3">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    step > i + 1
                      ? "bg-chart-2 text-white"
                      : step === i + 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </span>
                <span
                  className={cn(
                    "truncate text-xs",
                    step === i + 1
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          {done ? (
            <div className="py-12 text-center">
              <div className="mb-3 text-5xl">✅</div>
              <p className="text-base font-semibold">
                Part Berhasil Ditambahkan
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <strong>{form.partName}</strong> ({form.partCode})
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Button variant="outline" onClick={reset}>
                  Tambah Lagi
                </Button>
                <Button onClick={close}>Selesai</Button>
              </div>
            </div>
          ) : step === 1 ? (
            <>
              {labelled(
                "Part Name",
                true,
                <Input
                  value={form.partName}
                  onChange={(e) => set("partName", e.target.value)}
                  placeholder="Nama part…"
                />,
              )}
              {labelled(
                "Part Code",
                true,
                <Input
                  value={form.partCode}
                  onChange={(e) => set("partCode", e.target.value)}
                  placeholder="MIA-EL-XXX"
                  className="font-mono"
                />,
              )}
              <div className="grid grid-cols-2 gap-3">
                {labelled(
                  "Maker",
                  true,
                  <Input
                    value={form.maker}
                    onChange={(e) => set("maker", e.target.value)}
                  />,
                )}
                {labelled(
                  "Type",
                  true,
                  <Select
                    value={form.type}
                    onValueChange={(v) => set("type", v as PartType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>,
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {labelled(
                  "Category",
                  true,
                  <Input
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    placeholder="e.g. Sensor"
                  />,
                )}
                {labelled(
                  "Unit",
                  true,
                  <Select
                    value={form.unit}
                    onValueChange={(v) => set("unit", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>,
                )}
              </div>
              {labelled(
                "Price per Unit",
                false,
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="0"
                    className="pl-9 font-mono"
                  />
                </div>,
              )}
              {labelled(
                "Description",
                false,
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />,
              )}
              {labelled(
                "Remarks",
                false,
                <Input
                  value={form.remarks}
                  onChange={(e) => set("remarks", e.target.value)}
                />,
              )}
            </>
          ) : step === 2 ? (
            <>
              <p className="text-sm font-semibold">Stock Thresholds</p>
              <div className="grid grid-cols-4 gap-2">
                {labelled(
                  "Min",
                  true,
                  <Input
                    type="number"
                    min="0"
                    value={form.minStock}
                    onChange={(e) => set("minStock", e.target.value)}
                    className="font-mono"
                  />,
                )}
                {labelled(
                  "Std",
                  false,
                  <Input
                    type="number"
                    min="0"
                    value={form.stdStock}
                    onChange={(e) => set("stdStock", e.target.value)}
                    className="font-mono"
                  />,
                )}
                {labelled(
                  "Max",
                  false,
                  <Input
                    type="number"
                    min="0"
                    value={form.maxStock}
                    onChange={(e) => set("maxStock", e.target.value)}
                    className="font-mono"
                  />,
                )}
                {labelled(
                  "Initial",
                  false,
                  <Input
                    type="number"
                    min="0"
                    value={form.initialStock}
                    onChange={(e) => set("initialStock", e.target.value)}
                    className="font-mono"
                  />,
                )}
              </div>
              <p className="pt-1 text-sm font-semibold">
                Storage Location{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (opsional)
                </span>
              </p>
              <div className="grid grid-cols-4 gap-2">
                {labelled(
                  "Type",
                  false,
                  <Select
                    value={form.storageType || "none"}
                    onValueChange={(v) =>
                      set("storageType", v === "none" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {["A", "B", "C", "D", "E"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>,
                )}
                {labelled(
                  "Number",
                  false,
                  <Input
                    type="number"
                    min="1"
                    value={form.storageNumber}
                    onChange={(e) => set("storageNumber", e.target.value)}
                    className="font-mono"
                  />,
                )}
                {labelled(
                  "Box",
                  false,
                  <Input
                    type="number"
                    min="1"
                    value={form.storageBox}
                    onChange={(e) => set("storageBox", e.target.value)}
                    className="font-mono"
                  />,
                )}
                {labelled(
                  "Box Kecil",
                  false,
                  <Input
                    type="number"
                    min="1"
                    value={form.storageBoxKecil}
                    onChange={(e) => set("storageBoxKecil", e.target.value)}
                    className="font-mono"
                  />,
                )}
              </div>
              {hasAllStorage && (
                <div className="rounded-md border bg-muted/40 p-2.5 text-sm">
                  Barcode:{" "}
                  <span className="font-mono text-base font-bold tracking-wide">
                    {barcode}
                  </span>{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    {storageAddr}
                  </span>
                </div>
              )}
              {conflict && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="text-xs">
                    <p className="font-semibold text-destructive">
                      Storage sudah digunakan!
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      Alamat{" "}
                      <code className="font-mono">{storageAddr}</code> dipakai
                      part aktif lain. Nonaktifkan part itu dulu, atau pilih
                      lokasi lain.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="rounded-lg border p-3 text-sm">
                <p className="mb-1 font-semibold">Identitas Part</p>
                <p>
                  <strong>{form.partName || "—"}</strong> ({form.partCode || "—"})
                </p>
                <p className="text-muted-foreground">
                  {form.maker} · <TypeBadge type={form.type} /> ·{" "}
                  {form.category} · {form.unit}
                </p>
                <p className="text-muted-foreground">
                  Price: {formatPrice(numOrU(form.price) ?? null)}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="mb-1 font-semibold">Stok &amp; Lokasi</p>
                <p className="text-muted-foreground">
                  Min {form.minStock || 0} / Std {form.stdStock || "—"} / Max{" "}
                  {form.maxStock || "—"} · Initial {form.initialStock || 0}
                </p>
                <p className="text-muted-foreground">
                  Storage: {storageAddr}
                  {hasAllStorage && ` · Barcode ${barcode}`}
                </p>
              </div>
            </>
          )}
        </div>

        {!done && (
          <div className="flex items-center gap-2 border-t p-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Kembali
              </Button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <Button
                disabled={(step === 1 && !canStep2) || (step === 2 && conflict)}
                onClick={() => setStep((s) => s + 1)}
              >
                Lanjut
              </Button>
            ) : (
              <Button disabled={saving} onClick={submit}>
                <Plus className="mr-1 h-4 w-4" />
                {saving ? "Menyimpan…" : "Simpan Part"}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
