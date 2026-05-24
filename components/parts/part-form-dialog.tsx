"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  MapPin,
  Package,
  Plus,
  Tag,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CreatableSelect } from "@/components/shared/creatable-select";
import { TypeBadge } from "@/components/shared/type-badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createPart } from "@/lib/actions/parts.actions";
import { CreatePartSchema } from "@/lib/validations/parts.schema";
import { generateBarcode, formatStorageAddr } from "@/lib/utils/barcode";
import { formatPrice } from "@/lib/utils/format";
import type { CreatePartInput, PartClass, PartType } from "@/lib/types";

const EMPTY = {
  partName: "",
  partCode: "",
  maker: "",
  type: "Electrical" as PartType,
  category: "",
  partClass: "consumable" as PartClass,
  // Unit is free-form (CreatableSelect can add new ones); keep as wide string.
  unit: "pcs" as string,
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

const STEPS = [
  { n: 1, label: "Identity", icon: Info },
  { n: 2, label: "Location & Stock", icon: MapPin },
  { n: 3, label: "Preview", icon: CheckCircle2 },
] as const;

const TYPES: PartType[] = ["Electrical", "Mechanical", "Fabrication"];
const PART_CLASSES: { value: PartClass; label: string }[] = [
  { value: "consumable", label: "Consumable" },
  { value: "existing_project", label: "Existing Project" },
];
const STORAGE_TYPES: { value: "A" | "B"; label: string }[] = [
  { value: "A", label: "A — Lemari" },
  { value: "B", label: "B — Rak" },
];

const numOrU = (s: string): number | undefined =>
  s.trim() === "" ? undefined : Number(s);

/** A labelled form field with an optional required asterisk + hint. */
function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface PartFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: string[];
  categories: string[];
  usedBarcodes: string[];
  usedAddresses: string[];
}

/** "Tambah Part" centered floating dialog — 3-step wizard. */
export function PartFormDialog({
  open,
  onOpenChange,
  units,
  categories,
  usedBarcodes,
  usedAddresses,
}: PartFormDialogProps) {
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
    !!form.partName.trim() &&
    !!form.partCode.trim() &&
    !!form.maker.trim() &&
    !!form.category.trim() &&
    !!form.unit;

  const submit = async () => {
    const input: CreatePartInput = {
      partName: form.partName,
      partCode: form.partCode,
      maker: form.maker,
      type: form.type,
      category: form.category,
      partClass: form.partClass,
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
      toast.error(check.error.issues[0]?.message ?? "Please review your input");
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

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : close())}>
      <DialogContent
        className="flex max-h-[90vh] w-[95vw] max-w-2xl flex-col gap-0 p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* HEADER */}
        <DialogHeader className="border-b px-6 pb-4 pt-6 text-left">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Add New Part</DialogTitle>
              <DialogDescription className="text-xs">
                Fill in the part data to add it to the inventory.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* STEPPER */}
        {!done && (
          <div className="border-b bg-muted/30 px-6 py-4">
            <div className="flex items-center">
              {STEPS.map((s, i) => {
                const StepIcon = s.icon;
                const isActive = step === s.n;
                const isDone = step > s.n;
                return (
                  <div
                    key={s.n}
                    className="flex flex-1 items-center last:flex-none"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                          isDone && "bg-chart-2 text-white",
                          isActive &&
                            "bg-primary text-primary-foreground ring-4 ring-primary/15",
                          !isActive &&
                            !isDone &&
                            "bg-background text-muted-foreground ring-1 ring-border",
                        )}
                      >
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                      </div>
                      <div className="hidden sm:block">
                        <p
                          className={cn(
                            "text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
                            (isActive || isDone) && "text-foreground/70",
                          )}
                        >
                          Step {s.n}
                        </p>
                        <p
                          className={cn(
                            "text-xs font-semibold",
                            isActive ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          <StepIcon className="mr-1 inline h-3 w-3" />
                          {s.label}
                        </p>
                      </div>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "mx-3 h-px flex-1 transition-colors",
                          step > s.n ? "bg-chart-2" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {done ? (
            // ── Success ────────────────────────────────────────────────
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-chart-2/15 text-chart-2">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <p className="text-lg font-semibold">Part Added Successfully</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <strong className="text-foreground">{form.partName}</strong>{" "}
                <span className="tabular-nums">({form.partCode})</span>
              </p>
              {hasAllStorage && (
                <div className="mt-4 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Barcode: </span>
                  <span className="tabular-nums font-semibold">{barcode}</span>
                </div>
              )}
              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={reset}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Another
                </Button>
                <Button onClick={close}>Done</Button>
              </div>
            </div>
          ) : step === 1 ? (
            // ── Step 1: Identitas ──────────────────────────────────────
            <div className="space-y-4">
              <SectionHeader icon={Info}>Part Identity</SectionHeader>
              <Field label="Part Name" required>
                <Input
                  value={form.partName}
                  onChange={(e) => set("partName", e.target.value)}
                  placeholder="e.g. Sensor Proximity M12"
                />
              </Field>
              <Field
                label="Part Code"
                required
                hint="Internal format follows the MIA-XX-NNN convention."
              >
                <Input
                  value={form.partCode}
                  onChange={(e) => set("partCode", e.target.value)}
                  placeholder="MIA-EL-XXX"
                  className="tabular-nums"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Maker" required>
                  <Input
                    value={form.maker}
                    onChange={(e) => set("maker", e.target.value)}
                    placeholder="e.g. Keyence"
                  />
                </Field>
                <Field label="Type" required>
                  <Select
                    value={form.type}
                    onValueChange={(v) => set("type", v as PartType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                          className="capitalize"
                        >
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Source" required>
                  <Select
                    value={form.partClass}
                    onValueChange={(v) => set("partClass", v as PartClass)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PART_CLASSES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Category" required>
                  <CreatableSelect
                    value={form.category}
                    onChange={(v) => set("category", v)}
                    options={categories}
                    placeholder="Select or add category…"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Unit" required>
                  <CreatableSelect
                    value={form.unit}
                    onChange={(v) => set("unit", v)}
                    options={units}
                    placeholder="Select or add unit…"
                  />
                </Field>
                <Field label="Price per Unit">
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
                      className="pl-9 tabular-nums"
                    />
                  </div>
                </Field>
              </div>

              <Field label="Description">
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Deskripsi singkat (opsional)…"
                />
              </Field>
              <Field label="Remarks">
                <Input
                  value={form.remarks}
                  onChange={(e) => set("remarks", e.target.value)}
                  placeholder="Catatan tambahan (opsional)"
                />
              </Field>
            </div>
          ) : step === 2 ? (
            // ── Step 2: Lokasi & Stok ──────────────────────────────────
            <div className="space-y-5">
              {/* Stock thresholds */}
              <div>
                <SectionHeader icon={TrendingUp}>
                  Stock Thresholds
                </SectionHeader>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <Field label="Min" required>
                    <Input
                      type="number"
                      min="0"
                      value={form.minStock}
                      onChange={(e) => set("minStock", e.target.value)}
                      className="tabular-nums"
                    />
                  </Field>
                  <Field label="Std">
                    <Input
                      type="number"
                      min="0"
                      value={form.stdStock}
                      onChange={(e) => set("stdStock", e.target.value)}
                      className="tabular-nums"
                    />
                  </Field>
                  <Field label="Max">
                    <Input
                      type="number"
                      min="0"
                      value={form.maxStock}
                      onChange={(e) => set("maxStock", e.target.value)}
                      className="tabular-nums"
                    />
                  </Field>
                  <Field label="Initial">
                    <Input
                      type="number"
                      min="0"
                      value={form.initialStock}
                      onChange={(e) => set("initialStock", e.target.value)}
                      className="tabular-nums"
                    />
                  </Field>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Rule: Min ≤ Std ≤ Max. Initial = starting stock already in the
                  warehouse.
                </p>
              </div>

              {/* Storage Location */}
              <div>
                <SectionHeader icon={MapPin}>
                  Storage Location{" "}
                  <span className="ml-1 font-normal text-muted-foreground">
                    (optional)
                  </span>
                </SectionHeader>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <Field label="Lemari">
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
                        {STORAGE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Number">
                    <Input
                      type="number"
                      min="1"
                      value={form.storageNumber}
                      onChange={(e) => set("storageNumber", e.target.value)}
                      className="tabular-nums"
                    />
                  </Field>
                  <Field label="Box">
                    <Input
                      type="number"
                      min="1"
                      value={form.storageBox}
                      onChange={(e) => set("storageBox", e.target.value)}
                      className="tabular-nums"
                    />
                  </Field>
                  <Field label="Box Kecil">
                    <Input
                      type="number"
                      min="1"
                      value={form.storageBoxKecil}
                      onChange={(e) => set("storageBoxKecil", e.target.value)}
                      className="tabular-nums"
                    />
                  </Field>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Leave all empty if the part has no location yet — status will
                  be marked <strong>unassigned</strong>.
                </p>

                {/* Barcode preview — always visible, with an availability badge. */}
                <div
                  className={cn(
                    "mt-3 rounded-lg border p-3 transition-colors",
                    !hasAllStorage && "border-dashed bg-muted/30",
                    hasAllStorage && !conflict && "border-chart-2/40 bg-chart-2/5",
                    hasAllStorage && conflict &&
                      "border-destructive/40 bg-destructive/5",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Barcode Preview
                    </p>
                    {hasAllStorage ? (
                      conflict ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          Already Used
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-chart-2/15 px-2 py-0.5 text-[10px] font-semibold text-chart-2">
                          <CheckCircle2 className="h-3 w-3" />
                          Available
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        Fill in all location fields
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "tabular-nums text-lg font-bold tracking-wider",
                        !hasAllStorage && "text-muted-foreground/40",
                      )}
                    >
                      {hasAllStorage ? barcode : "—"}
                    </span>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {hasAllStorage ? storageAddr : "—"}
                    </span>
                  </div>
                </div>

                {conflict && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="text-xs">
                      <p className="font-semibold text-destructive">
                        Storage already used!
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        Address <code className="tabular-nums">{storageAddr}</code>{" "}
                        is used by another active part. Deactivate that part first,
                        or pick a different location.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ── Step 3: Preview ────────────────────────────────────────
            <div className="space-y-4">
              <SectionHeader icon={CheckCircle2}>
                Review &amp; Confirm
              </SectionHeader>

              <PreviewCard
                title="Part Identity"
                icon={Info}
                items={[
                  ["Part Name", form.partName || "—"],
                  ["Part Code", form.partCode || "—", "mono"],
                  ["Maker", form.maker || "—"],
                  ["Type", <TypeBadge key="t" type={form.type} />],
                  [
                    "Source",
                    PART_CLASSES.find((c) => c.value === form.partClass)
                      ?.label ?? "—",
                  ],
                  ["Category", form.category || "—"],
                  ["Unit", form.unit],
                  ["Price", formatPrice(numOrU(form.price) ?? null), "mono"],
                ]}
              />

              <PreviewCard
                title="Stock & Location"
                icon={Tag}
                items={[
                  [
                    "Min / Std / Max",
                    `${form.minStock || 0} / ${form.stdStock || "—"} / ${form.maxStock || "—"}`,
                    "mono",
                  ],
                  ["Initial Stock", form.initialStock || 0, "mono"],
                  [
                    "Storage",
                    hasAllStorage ? storageAddr : "Not assigned",
                    "mono",
                  ],
                  ...(hasAllStorage
                    ? ([["Barcode", barcode, "mono"]] as const)
                    : []),
                ]}
              />

              {/* Storage availability card — mirrors Step 2 so the user can
                  confirm one last time before saving. */}
              {hasAllStorage && (
                <div
                  className={cn(
                    "rounded-lg border p-3",
                    conflict
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-chart-2/40 bg-chart-2/5",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Location Status
                    </p>
                    {conflict ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        Sudah Digunakan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-chart-2/15 px-2 py-0.5 text-[10px] font-semibold text-chart-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Available
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="tabular-nums text-lg font-bold tracking-wider">
                      {barcode}
                    </span>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {storageAddr}
                    </span>
                  </div>
                  {conflict && (
                    <p className="mt-2 text-[11px] text-destructive">
                      This location is used by another active part. Go back to
                      step 2 to choose a different location.
                    </p>
                  )}
                </div>
              )}

              {(form.description || form.remarks) && (
                <PreviewCard
                  title="Notes"
                  icon={Info}
                  items={[
                    ...(form.description
                      ? ([["Description", form.description]] as const)
                      : []),
                    ...(form.remarks
                      ? ([["Remarks", form.remarks]] as const)
                      : []),
                  ]}
                />
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {!done && (
          <div className="flex items-center gap-2 border-t bg-muted/20 px-6 py-3">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <div className="flex-1" />
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={saving}
              >
                ← Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                disabled={(step === 1 && !canStep2) || (step === 2 && conflict)}
                onClick={() => setStep((s) => s + 1)}
              >
                Next →
              </Button>
            ) : (
              <Button disabled={saving || conflict} onClick={submit}>
                <Plus className="mr-1 h-4 w-4" />
                {saving ? "Saving…" : "Save Part"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Section header with an icon + an underline-like spacing. */
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

type PreviewItem = readonly [
  string,
  React.ReactNode | string | number,
  "mono"?,
];

/** A small read-only summary card used by step 3 (Preview). */
function PreviewCard({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: readonly PreviewItem[];
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="divide-y">
        {items.map(([label, value, fmt], i) => (
          <div
            key={`${label}-${i}`}
            className="flex items-center justify-between gap-3 py-1.5 text-sm"
          >
            <span className="text-muted-foreground">{label}</span>
            <span
              className={cn(
                "text-right font-medium text-foreground",
                fmt === "mono" && "tabular-nums text-xs",
              )}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
