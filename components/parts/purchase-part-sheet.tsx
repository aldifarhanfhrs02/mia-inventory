"use client";

import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createPurchase } from "@/lib/actions/purchase.actions";
import { formatPrice } from "@/lib/utils/format";
import type { PartTableRow } from "@/lib/actions/parts.actions";

interface PurchasePartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: PartTableRow | null;
}

/** Purchase request form, opened from a low/out-of-stock part. */
export function PurchasePartSheet({
  open,
  onOpenChange,
  part,
}: PurchasePartSheetProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    supplier: "",
    qty: "",
    eta: "",
    po: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[440px] flex-col gap-0 sm:max-w-[440px]"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Purchase Part
          </SheetTitle>
        </SheetHeader>

        {done ? (
          <div className="flex-1 px-4 py-12 text-center">
            <div className="mb-3 text-5xl">✅</div>
            <p className="text-base font-semibold">
              Purchase Request Submitted
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <strong>{part?.partName}</strong> — {form.qty} {part?.unit} dari{" "}
              {form.supplier}
            </p>
            <Button className="mt-5" onClick={() => onOpenChange(false)}>
              Selesai
            </Button>
          </div>
        ) : (
          part && (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {part.partName}
                    </span>
                    <StatusBadge status={part.stockStatus} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Part Code</span>
                    <span className="text-right font-mono">
                      {part.partCode}
                    </span>
                    <span className="text-muted-foreground">Current Stock</span>
                    <span className="text-right font-mono font-semibold text-chart-4">
                      {part.currentStock} {part.unit}
                    </span>
                    <span className="text-muted-foreground">Min Stock</span>
                    <span className="text-right font-mono">
                      {part.minStock} {part.unit}
                    </span>
                    <span className="text-muted-foreground">Price/Unit</span>
                    <span className="text-right font-mono">
                      {formatPrice(part.price)}
                    </span>
                  </div>
                  <div className="mt-2 rounded-md border border-primary/15 bg-primary/5 p-2 text-xs">
                    Rekomendasi order:{" "}
                    <strong className="font-mono">
                      {recommended} {part.unit}
                    </strong>{" "}
                    <span className="text-muted-foreground">
                      (kembali ke std stock)
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Supplier<span className="text-destructive"> *</span>
                  </Label>
                  <Input
                    value={form.supplier}
                    onChange={(e) => set("supplier", e.target.value)}
                    placeholder="Nama supplier…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>
                      Quantity<span className="text-destructive"> *</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.qty}
                      onChange={(e) => set("qty", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ETA</Label>
                    <Input
                      type="date"
                      value={form.eta}
                      onChange={(e) => set("eta", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                {total > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Estimasi Total</span>
                    <span className="font-mono text-base font-bold">
                      {formatPrice(total)}
                    </span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>PO Number</Label>
                  <Input
                    value={form.po}
                    onChange={(e) => set("po", e.target.value)}
                    placeholder="PO-2026-XXXX"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 border-t p-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Batal
                </Button>
                <div className="flex-1" />
                <Button disabled={!canSubmit || saving} onClick={submit}>
                  <ShoppingCart className="mr-1 h-4 w-4" />
                  {saving ? "Menyimpan…" : "Submit Purchase"}
                </Button>
              </div>
            </>
          )
        )}
      </SheetContent>
    </Sheet>
  );
}
