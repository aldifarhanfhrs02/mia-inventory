"use client";

import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
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
import { cn } from "@/lib/utils";
import { assignLocation } from "@/lib/actions/parts.actions";
import { generateBarcode, formatStorageAddr } from "@/lib/utils/barcode";
import type { PartTableRow } from "@/lib/actions/parts.actions";

const STORAGE_TYPES = [
  { value: "A", label: "A — Lemari" },
  { value: "B", label: "B — Rak" },
];

interface AssignLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: PartTableRow | null;
  usedBarcodes: string[];
  usedAddresses: string[];
}

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

/** Section heading with an icon — used inside each card. */
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

/** Centered floating dialog to assign a storage location + barcode. */
export function AssignLocationDialog({
  open,
  onOpenChange,
  part,
  usedBarcodes,
  usedAddresses,
}: AssignLocationDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    storageType: "",
    storageNumber: "",
    storageBox: "",
    storageBoxKecil: "",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const complete =
    !!form.storageType &&
    !!form.storageNumber &&
    !!form.storageBox &&
    !!form.storageBoxKecil;
  const addr = complete
    ? formatStorageAddr(
        form.storageType,
        Number(form.storageNumber),
        Number(form.storageBox),
        Number(form.storageBoxKecil),
      )
    : "—";
  const barcode = complete
    ? generateBarcode(
        form.storageType,
        Number(form.storageNumber),
        Number(form.storageBox),
        Number(form.storageBoxKecil),
      )
    : "—";
  const conflict =
    complete &&
    (usedAddresses.includes(addr) || usedBarcodes.includes(barcode));

  const submit = async () => {
    if (!part || !complete || conflict) return;
    setSaving(true);
    const res = await assignLocation(part.id, {
      storageType: form.storageType,
      storageNumber: Number(form.storageNumber),
      storageBox: Number(form.storageBox),
      storageBoxKecil: Number(form.storageBoxKecil),
    });
    setSaving(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[95vw] max-w-xl flex-col gap-0 p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* HEADER */}
        <DialogHeader className="border-b px-6 pb-4 pt-6 text-left">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Assign Location</DialogTitle>
              <DialogDescription className="text-xs">
                Set a storage location to activate this part. The barcode is
                automatically generated from the location combination.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {done ? (
            // ── Success ─────────────────────────────────────────────
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-chart-2/15 text-chart-2">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <p className="text-lg font-semibold">
                Location Assigned Successfully
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {part?.partName}
              </p>
              <div className="mt-4 rounded-lg border border-chart-2/40 bg-chart-2/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Barcode
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums tracking-wider">
                  {barcode}
                </p>
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  {addr}
                </p>
              </div>
              <Button className="mt-6" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          ) : (
            part && (
              <div className="space-y-5">
                {/* PART INFO CARD */}
                <div className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {part.partName}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {part.partCode} · {part.maker}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="unassigned" />
                </div>

                {/* INFO NOTE */}
                <div className="flex items-start gap-2 rounded-lg border border-chart-3/30 bg-chart-3/5 p-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-chart-3" />
                  <span className="text-xs text-foreground">
                    This part has no location yet. Fill in all 4 fields below —
                    the status will automatically change to <strong>active</strong>{" "}
                    after saving.
                  </span>
                </div>

                {/* STORAGE FIELDS */}
                <section>
                  <SectionHeader icon={MapPin}>
                    Storage Location
                  </SectionHeader>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <Field label="Lemari" required>
                      <Select
                        value={form.storageType}
                        onValueChange={(v) => set("storageType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {STORAGE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Number" required>
                      <Input
                        type="number"
                        min="1"
                        value={form.storageNumber}
                        onChange={(e) => set("storageNumber", e.target.value)}
                        className="tabular-nums"
                      />
                    </Field>
                    <Field label="Box" required>
                      <Input
                        type="number"
                        min="1"
                        value={form.storageBox}
                        onChange={(e) => set("storageBox", e.target.value)}
                        className="tabular-nums"
                      />
                    </Field>
                    <Field label="Box Kecil" required>
                      <Input
                        type="number"
                        min="1"
                        value={form.storageBoxKecil}
                        onChange={(e) => set("storageBoxKecil", e.target.value)}
                        className="tabular-nums"
                      />
                    </Field>
                  </div>
                </section>

                {/* BARCODE PREVIEW — always visible with status badge */}
                <div
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    !complete && "border-dashed bg-muted/30",
                    complete && !conflict &&
                      "border-chart-2/40 bg-chart-2/5",
                    complete && conflict &&
                      "border-destructive/40 bg-destructive/5",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Barcode Preview
                    </p>
                    {complete ? (
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
                        "text-lg font-bold tabular-nums tracking-wider",
                        !complete && "text-muted-foreground/40",
                      )}
                    >
                      {complete ? barcode : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {complete ? addr : "—"}
                    </span>
                  </div>
                </div>

                {/* Conflict detail */}
                {conflict && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="text-xs">
                      <p className="font-semibold text-destructive">
                        Storage already used!
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        Address{" "}
                        <code className="tabular-nums">{addr}</code> is used by
                        another active part. Pick a different location, or
                        deactivate the existing part.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* FOOTER */}
        {!done && (
          <div className="flex items-center gap-2 border-t bg-muted/20 px-6 py-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex-1" />
            <Button
              disabled={!complete || conflict || saving}
              onClick={submit}
            >
              <MapPin className="mr-1.5 h-4 w-4" />
              {saving ? "Saving…" : "Assign Location"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
