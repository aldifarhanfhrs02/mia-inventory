"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Info,
  ShoppingCart,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createPurchase } from "@/lib/actions/purchase.actions";
import { formatPrice } from "@/lib/utils/format";
import type { PartTableRow } from "@/lib/actions/parts.actions";

interface PurchasePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: PartTableRow | null;
}

const EMPTY = {
  supplier: "",
  qty: "",
  eta: "",
  po: "",
  notes: "",
};

/** Centered purchase request dialog — opened from low/out-of-stock parts. */
export function PurchasePartDialog({
  open,
  onOpenChange,
  part,
}: PurchasePartDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const reset = () => {
    setForm(EMPTY);
    setDone(false);
  };
  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const recommended = part
    ? Math.max(0, (part.stdStock ?? 0) - part.currentStock)
    : 0;
  const qtyNum = Number(form.qty) || 0;
  const total = part?.price ? part.price * qtyNum : 0;
  const canSubmit = !!form.supplier.trim() && qtyNum > 0;

  const submit = async () => {
    if (!part || !canSubmit) return;
    setSaving(true);
    const res = await createPurchase({
      partId: part.id,
      supplier: form.supplier,
      qtyOrdered: qtyNum,
      expectedArrival: form.eta || undefined,
      poNumber: form.po || undefined,
      notes: form.notes || undefined,
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
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : close())}>
      <DialogContent
        className="flex max-h-[90vh] w-[95vw] max-w-2xl flex-col gap-0 p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* HEADER */}
        <DialogHeader className="border-b px-6 pb-4 pt-6 text-left">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Purchase Part</DialogTitle>
              <DialogDescription className="text-xs">
                Buat purchase request untuk part dengan stok kritis.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {done ? (
            // ── Success state ───────────────────────────────────────────
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-chart-2/15 text-chart-2">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <p className="text-lg font-semibold">
                Purchase Request Submitted
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <strong className="text-foreground">{part?.partName}</strong> —{" "}
                <span className="tabular-nums">
                  {form.qty} {part?.unit}
                </span>{" "}
                dari <strong className="text-foreground">{form.supplier}</strong>
              </p>
              {total > 0 && (
                <div className="mt-4 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">
                    Estimasi Total:{" "}
                  </span>
                  <span className="tabular-nums font-semibold">
                    {formatPrice(total)}
                  </span>
                </div>
              )}
              <Button className="mt-6" onClick={close}>
                Selesai
              </Button>
            </div>
          ) : (
            part && (
              <div className="space-y-5">
                {/* Part info hero card */}
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">
                        {part.partName}
                      </p>
                      <p className="tabular-nums text-xs text-muted-foreground">
                        {part.partCode}
                      </p>
                    </div>
                    <StatusBadge status={part.stockStatus} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <Stat
                      label="Current Stock"
                      value={`${part.currentStock} ${part.unit}`}
                      tone="danger"
                    />
                    <Stat
                      label="Min Stock"
                      value={`${part.minStock} ${part.unit}`}
                    />
                    <Stat
                      label="Std Stock"
                      value={`${part.stdStock ?? "—"} ${part.unit}`}
                    />
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <p className="text-xs">
                      Rekomendasi order:{" "}
                      <button
                        type="button"
                        onClick={() => set("qty", String(recommended))}
                        className="tabular-nums font-semibold text-primary hover:underline"
                      >
                        {recommended} {part.unit}
                      </button>{" "}
                      <span className="text-muted-foreground">
                        (untuk kembali ke std stock — klik untuk pakai)
                      </span>
                    </p>
                  </div>
                </div>

                {/* Form section: order details */}
                <div>
                  <SectionHeader icon={ShoppingCart}>Detail Order</SectionHeader>
                  <div className="mt-3 space-y-4">
                    <Field label="Supplier" required>
                      <Input
                        value={form.supplier}
                        onChange={(e) => set("supplier", e.target.value)}
                        placeholder="Contoh: PT Schneider Electric"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Quantity" required>
                        <div className="relative">
                          <Input
                            type="number"
                            min="1"
                            value={form.qty}
                            onChange={(e) => set("qty", e.target.value)}
                            placeholder="0"
                            className="tabular-nums pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {part.unit}
                          </span>
                        </div>
                      </Field>
                      <Field label="ETA (perkiraan tiba)">
                        <Input
                          type="date"
                          value={form.eta}
                          onChange={(e) => set("eta", e.target.value)}
                          className="tabular-nums"
                        />
                      </Field>
                    </div>

                    <Field label="PO Number">
                      <Input
                        value={form.po}
                        onChange={(e) => set("po", e.target.value)}
                        placeholder="PO-2026-XXXX"
                        className="tabular-nums"
                      />
                    </Field>
                    <Field label="Notes">
                      <Textarea
                        rows={2}
                        value={form.notes}
                        onChange={(e) => set("notes", e.target.value)}
                        placeholder="Catatan tambahan untuk purchase request (opsional)…"
                      />
                    </Field>
                  </div>
                </div>

                {/* Live estimate */}
                {(qtyNum > 0 || part.price != null) && (
                  <div
                    className={cn(
                      "rounded-lg border p-3",
                      qtyNum > 0
                        ? "border-primary/30 bg-primary/5"
                        : "border-dashed bg-muted/30",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Estimasi Total
                      </p>
                      {part.price == null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          <AlertTriangle className="h-3 w-3" />
                          Harga belum diset
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="tabular-nums text-lg font-bold text-primary">
                        {formatPrice(total || null)}
                      </span>
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {qtyNum > 0
                          ? `${qtyNum} ${part.unit} × ${formatPrice(part.price)}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Recap */}
                {canSubmit && (
                  <div className="rounded-lg border bg-card p-4">
                    <SectionHeader icon={ClipboardList}>Ringkasan</SectionHeader>
                    <div className="mt-2 divide-y text-sm">
                      <Row label="Supplier" value={form.supplier} />
                      <Row
                        label="Qty"
                        value={`${qtyNum} ${part.unit}`}
                        mono
                      />
                      {form.eta && (
                        <Row label="ETA" value={form.eta} mono />
                      )}
                      {form.po && (
                        <Row label="PO Number" value={form.po} mono />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* FOOTER */}
        {!done && part && (
          <div className="flex items-center gap-2 border-t bg-muted/20 px-6 py-3">
            <Button variant="ghost" onClick={close}>
              Batal
            </Button>
            <div className="flex-1" />
            <Button disabled={!canSubmit || saving} onClick={submit}>
              <ShoppingCart className="mr-1 h-4 w-4" />
              {saving ? "Menyimpan…" : "Submit Purchase"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Section header with an icon — matches the Tambah Part dialog style. */
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

/** A labelled form field with an optional required asterisk. */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

/** Read-only label/value row used inside the recap card. */
function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right font-medium text-foreground",
          mono && "tabular-nums text-xs",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** A tiny stat tile for the part info card. */
function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 tabular-nums text-sm font-semibold",
          tone === "danger" ? "text-chart-4" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
