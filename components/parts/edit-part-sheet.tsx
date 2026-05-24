"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CreatableSelect } from "@/components/shared/creatable-select";
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
import { Textarea } from "@/components/ui/textarea";
import { updatePart } from "@/lib/actions/parts.actions";
import { UpdatePartSchema } from "@/lib/validations/parts.schema";
import type { PartClass, PartType, UpdatePartInput } from "@/lib/types";
import type { PartTableRow } from "@/lib/actions/parts.actions";

const TYPES: PartType[] = ["Electrical", "Mechanical", "Fabrication"];
const PART_CLASSES: { value: PartClass; label: string }[] = [
  { value: "consumable", label: "Consumable" },
  { value: "existing_project", label: "Existing Project" },
];
const numOrU = (s: string): number | undefined =>
  s.trim() === "" ? undefined : Number(s);

/** Build the editable form state from a part (empty when none). */
function formFromPart(part: PartTableRow | null) {
  return {
    partName: part?.partName ?? "",
    partCode: part?.partCode ?? "",
    maker: part?.maker ?? "",
    type: (part?.type ?? "Electrical") as PartType,
    category: part?.category ?? "",
    partClass: (part?.partClass ?? "consumable") as PartClass,
    // Unit is a free-form string at the DB level; CreatableSelect can add new ones.
    unit: (part?.unit ?? "pcs") as string,
    price: part?.price?.toString() ?? "",
    minStock: part ? String(part.minStock) : "",
    stdStock: part?.stdStock?.toString() ?? "",
    maxStock: part?.maxStock?.toString() ?? "",
    description: part?.description ?? "",
    remarks: part?.remarks ?? "",
  };
}

interface EditPartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: PartTableRow | null;
  units: string[];
  categories: string[];
}

/** Single-page Edit Part sheet — identity, price, and stock thresholds. */
export function EditPartSheet({
  open,
  onOpenChange,
  part,
  units,
  categories,
}: EditPartSheetProps) {
  const router = useRouter();
  // Mounted with a `key` per part (see parts-client), so init directly.
  const [form, setForm] = useState(() => formFromPart(part));
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!part) return;
    const input: UpdatePartInput = {
      partName: form.partName,
      partCode: form.partCode,
      maker: form.maker,
      type: form.type,
      category: form.category,
      partClass: form.partClass,
      unit: form.unit as UpdatePartInput["unit"],
      description: form.description || undefined,
      remarks: form.remarks || undefined,
      price: numOrU(form.price),
      minStock: Number(form.minStock || 0),
      stdStock: numOrU(form.stdStock),
      maxStock: numOrU(form.maxStock),
    };
    const check = UpdatePartSchema.safeParse(input);
    if (!check.success) {
      toast.error(check.error.issues[0]?.message ?? "Please review your input");
      return;
    }
    setSaving(true);
    const res = await updatePart(part.id, input);
    setSaving(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const field = (label: string, key: keyof typeof form, mono?: boolean) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value as never)}
        className={mono ? "tabular-nums" : undefined}
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[460px] flex-col gap-0 sm:max-w-[460px]"
      >
        <SheetHeader>
          <SheetTitle>Edit Part</SheetTitle>
        </SheetHeader>

        {done ? (
          <div className="flex-1 px-4 py-12 text-center">
            <div className="mb-3 text-5xl">✅</div>
            <p className="text-base font-semibold">Part Updated Successfully</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <strong>{form.partName}</strong> ({form.partCode})
            </p>
            <Button className="mt-5" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          part && (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
                <div className="flex items-center gap-2 rounded-md border p-2.5">
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {part.partCode}
                  </span>
                  <StatusBadge
                    status={
                      part.status === "inactive"
                        ? "inactive"
                        : part.stockStatus
                    }
                  />
                </div>
                {field("Part Name", "partName")}
                {field("Part Code", "partCode", true)}
                <div className="grid grid-cols-2 gap-3">
                  {field("Maker", "maker")}
                  <div className="space-y-1.5">
                    <Label>Type</Label>
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
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Source</Label>
                    <Select
                      value={form.partClass}
                      onValueChange={(v) =>
                        set("partClass", v as PartClass)
                      }
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
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <CreatableSelect
                      value={form.category}
                      onChange={(v) => set("category", v)}
                      options={categories}
                      placeholder="Select or add category…"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <CreatableSelect
                    value={form.unit}
                    onChange={(v) => set("unit", v)}
                    options={units}
                    placeholder="Select or add unit…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Price per Unit</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      className="pl-9 tabular-nums"
                    />
                  </div>
                </div>
                <p className="pt-1 text-sm font-semibold">Stock Thresholds</p>
                <div className="grid grid-cols-3 gap-2">
                  {field("Min", "minStock", true)}
                  {field("Std", "stdStock", true)}
                  {field("Max", "maxStock", true)}
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>
                {field("Remarks", "remarks")}
              </div>
              <div className="flex items-center gap-2 border-t p-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <div className="flex-1" />
                <Button disabled={saving} onClick={submit}>
                  <Pencil className="mr-1 h-4 w-4" />
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </>
          )
        )}
      </SheetContent>
    </Sheet>
  );
}
