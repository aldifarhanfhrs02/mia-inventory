"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { createPart, updatePart } from "@/lib/actions/parts.actions";
import { CreatePartSchema } from "@/lib/validations/parts.schema";
import { generateBarcode } from "@/lib/utils/barcode";
import type { CreatePartInput, PartType, PartWithStock } from "@/lib/types";

/** Form values — numeric fields are kept as strings while editing. */
interface FormValues {
  partName: string;
  partCode: string;
  maker: string;
  type: PartType;
  category: string;
  unit: string;
  description: string;
  remarks: string;
  minStock: string;
  stdStock: string;
  maxStock: string;
  initialStock: string;
  storageType: string;
  storageNumber: string;
  storageBox: string;
  storageBoxKecil: string;
}

const EMPTY: FormValues = {
  partName: "",
  partCode: "",
  maker: "",
  type: "electrical",
  category: "",
  unit: "PCS",
  description: "",
  remarks: "",
  minStock: "0",
  stdStock: "",
  maxStock: "",
  initialStock: "0",
  storageType: "",
  storageNumber: "",
  storageBox: "",
  storageBoxKecil: "",
};

const TYPES: PartType[] = ["electrical", "mechanical", "fabrication"];
const num = (s: string): number | undefined =>
  s.trim() === "" ? undefined : Number(s);

interface PartFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the form edits this part; otherwise it creates a new one. */
  editPart: PartWithStock | null;
}

/** Three-step add / edit part wizard. */
export function PartFormSheet({
  open,
  onOpenChange,
  editPart,
}: PartFormSheetProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } =
    useForm<FormValues>({ defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    setStep(1);
    reset(
      editPart
        ? {
            partName: editPart.partName,
            partCode: editPart.partCode,
            maker: editPart.maker,
            type: editPart.type,
            category: editPart.category,
            unit: editPart.unit,
            description: editPart.description ?? "",
            remarks: editPart.remarks ?? "",
            minStock: String(editPart.minStock),
            stdStock: editPart.stdStock?.toString() ?? "",
            maxStock: editPart.maxStock?.toString() ?? "",
            initialStock: "0",
            storageType: editPart.storageType ?? "",
            storageNumber: editPart.storageNumber?.toString() ?? "",
            storageBox: editPart.storageBox?.toString() ?? "",
            storageBoxKecil: editPart.storageBoxKecil?.toString() ?? "",
          }
        : EMPTY,
    );
  }, [open, editPart, reset]);

  const v = watch();
  const barcodePreview =
    v.storageType && v.storageNumber && v.storageBox && v.storageBoxKecil
      ? generateBarcode(
          v.storageType,
          Number(v.storageNumber),
          Number(v.storageBox),
          Number(v.storageBoxKecil),
        )
      : "—";

  const onSubmit = (data: FormValues) => {
    const input: CreatePartInput = {
      partName: data.partName,
      partCode: data.partCode,
      maker: data.maker,
      type: data.type,
      category: data.category,
      unit: data.unit as CreatePartInput["unit"],
      description: data.description || undefined,
      remarks: data.remarks || undefined,
      minStock: Number(data.minStock || 0),
      stdStock: num(data.stdStock),
      maxStock: num(data.maxStock),
      initialStock: Number(data.initialStock || 0),
      storageType: (data.storageType ||
        undefined) as CreatePartInput["storageType"],
      storageNumber: num(data.storageNumber),
      storageBox: num(data.storageBox),
      storageBoxKecil: num(data.storageBoxKecil),
    };

    const check = CreatePartSchema.safeParse(input);
    if (!check.success) {
      toast.error(check.error.issues[0]?.message ?? "Periksa kembali isian");
      return;
    }

    setSaving(true);
    const action = editPart
      ? updatePart(editPart.id, input)
      : createPart(input);
    action
      .then((res) => {
        if (res.ok) {
          toast.success(editPart ? "Part diperbarui" : "Part ditambahkan");
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      })
      .finally(() => setSaving(false));
  };

  const field = (
    label: string,
    name: keyof FormValues,
    opts: { required?: boolean; type?: string } = {},
  ) => (
    <div className="space-y-1.5">
      <Label>
        {label}
        {opts.required && <span className="text-destructive"> *</span>}
      </Label>
      <Input type={opts.type ?? "text"} {...register(name)} />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[460px] flex-col sm:max-w-[460px]"
      >
        <SheetHeader>
          <SheetTitle>{editPart ? "Edit Part" : "Tambah Part"}</SheetTitle>
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  s <= step ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-3 overflow-y-auto px-4">
            {step === 1 && (
              <>
                <p className="text-sm font-semibold">Identitas</p>
                {field("Part Name", "partName", { required: true })}
                {field("Part Code", "partCode", { required: true })}
                {field("Maker", "maker", { required: true })}
                <div className="space-y-1.5">
                  <Label>
                    Type<span className="text-destructive"> *</span>
                  </Label>
                  <div className="flex gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setValue("type", t)}
                        className={cn(
                          "flex-1 rounded-md border py-1.5 text-sm capitalize",
                          v.type === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:bg-accent",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {field("Category", "category", { required: true })}
                {field("Unit", "unit", { required: true })}
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea rows={2} {...register("description")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Remarks</Label>
                  <Textarea rows={2} {...register("remarks")} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm font-semibold">Stok & Lokasi</p>
                <div className="grid grid-cols-3 gap-2">
                  {field("Min", "minStock", { required: true, type: "number" })}
                  {field("Std", "stdStock", { type: "number" })}
                  {field("Max", "maxStock", { type: "number" })}
                </div>
                {!editPart &&
                  field("Initial Stock", "initialStock", { type: "number" })}
                <p className="pt-2 text-xs text-muted-foreground">
                  Lokasi — isi keempatnya atau kosongkan semua.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {field("Storage Type (A–E)", "storageType")}
                  {field("Number", "storageNumber", { type: "number" })}
                  {field("Box", "storageBox", { type: "number" })}
                  {field("Box Kecil", "storageBoxKecil", { type: "number" })}
                </div>
                <div className="rounded-md border bg-muted/40 p-2 text-sm">
                  Barcode preview:{" "}
                  <span className="font-mono font-semibold">
                    {barcodePreview}
                  </span>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-sm font-semibold">Review</p>
                <div className="rounded-md border p-3 text-sm">
                  <p>
                    <strong>{v.partName || "—"}</strong> ({v.partCode || "—"})
                  </p>
                  <p className="text-muted-foreground">
                    {v.maker} · {v.type} · {v.category} · {v.unit}
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Min {v.minStock || 0} / Std {v.stdStock || "—"} / Max{" "}
                    {v.maxStock || "—"}
                  </p>
                  {!editPart && (
                    <p className="text-muted-foreground">
                      Initial stock: {v.initialStock || 0}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    Barcode: <span className="font-mono">{barcodePreview}</span>
                  </p>
                </div>
              </>
            )}
          </div>

          <SheetFooter className="flex-row gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep((s) => s - 1)}
              >
                Kembali
              </Button>
            )}
            {step < 3 && (
              <Button
                type="button"
                className="flex-1"
                onClick={() => setStep((s) => s + 1)}
              >
                Lanjut
              </Button>
            )}
            {step === 3 && (
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            )}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
