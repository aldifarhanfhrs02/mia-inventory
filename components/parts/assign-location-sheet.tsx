"use client";

import { AlertTriangle, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
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
import { assignLocation } from "@/lib/actions/parts.actions";
import { generateBarcode, formatStorageAddr } from "@/lib/utils/barcode";
import type { PartTableRow } from "@/lib/actions/parts.actions";

interface AssignLocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: PartTableRow | null;
  usedBarcodes: string[];
  usedAddresses: string[];
}

/** Assign a storage location + barcode to an unassigned part. */
export function AssignLocationSheet({
  open,
  onOpenChange,
  part,
  usedBarcodes,
  usedAddresses,
}: AssignLocationSheetProps) {
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
    : "";
  const conflict =
    complete &&
    (usedAddresses.includes(addr) || usedBarcodes.includes(barcode));

  const submit = async () => {
    if (!part || !complete) return;
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

  const numField = (label: string, key: keyof typeof form) => (
    <div className="space-y-1.5">
      <Label>
        {label}
        <span className="text-destructive"> *</span>
      </Label>
      <Input
        type="number"
        min="1"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="font-mono"
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[400px] flex-col gap-0 sm:max-w-[400px]"
      >
        <SheetHeader>
          <SheetTitle>Assign Lokasi</SheetTitle>
        </SheetHeader>

        {done ? (
          <div className="flex-1 px-4 py-12 text-center">
            <div className="mb-3 text-5xl">✅</div>
            <p className="text-base font-semibold">
              Lokasi Berhasil Di-assign
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{part?.partName}</p>
            <div className="mx-auto mt-3 w-fit rounded-md border bg-muted/40 px-4 py-2">
              <span className="font-mono text-xl font-bold tracking-wide">
                {barcode}
              </span>
            </div>
            <Button className="mt-5" onClick={() => onOpenChange(false)}>
              Selesai
            </Button>
          </div>
        ) : (
          part && (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-semibold">{part.partName}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {part.partCode}
                    </p>
                  </div>
                  <StatusBadge status="unassigned" />
                </div>

                <div className="flex items-start gap-2 rounded-md border border-chart-3/30 bg-chart-3/10 p-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-chart-3" />
                  <span className="text-xs">
                    Part ini belum memiliki lokasi. Assign lokasi untuk
                    mengaktifkannya.
                  </span>
                </div>

                <p className="text-sm font-semibold">Storage Location</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>
                      Type<span className="text-destructive"> *</span>
                    </Label>
                    <Select
                      value={form.storageType}
                      onValueChange={(v) => set("storageType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C", "D", "E"].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {numField("Number", "storageNumber")}
                  {numField("Box", "storageBox")}
                  {numField("Box Kecil", "storageBoxKecil")}
                </div>

                {complete && (
                  <div className="rounded-md border bg-muted/40 p-2.5 text-sm">
                    Barcode:{" "}
                    <span className="font-mono text-base font-bold tracking-wide">
                      {barcode}
                    </span>{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {addr}
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
                        Alamat <code className="font-mono">{addr}</code> dipakai
                        part aktif lain.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 border-t p-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Batal
                </Button>
                <div className="flex-1" />
                <Button
                  disabled={!complete || conflict || saving}
                  onClick={submit}
                >
                  <MapPin className="mr-1 h-4 w-4" />
                  {saving ? "Menyimpan…" : "Assign Lokasi"}
                </Button>
              </div>
            </>
          )
        )}
      </SheetContent>
    </Sheet>
  );
}
