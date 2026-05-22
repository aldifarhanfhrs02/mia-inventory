"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  makers: string[];
  categories: string[];
}

const TYPES = ["electrical", "mechanical", "fabrication"];
const STATUSES = [
  "available",
  "low_stock",
  "out_of_stock",
  "unassigned",
  "inactive",
];

/** Slide-over filter panel — Type, Status, Maker, Category. */
export function FilterSheet({
  open,
  onOpenChange,
  makers,
  categories,
}: FilterSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [type, setType] = useState(searchParams.get("type") ?? "all");
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");
  const [maker, setMaker] = useState(searchParams.get("maker") ?? "all");
  const [category, setCategory] = useState(
    searchParams.get("category") ?? "all",
  );

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of [
      ["type", type],
      ["status", status],
      ["maker", maker],
      ["category", category],
    ]) {
      if (val && val !== "all") params.set(key, val);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    onOpenChange(false);
  };

  const reset = () => {
    setType("all");
    setStatus("all");
    setMaker("all");
    setCategory("all");
  };

  const group = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    options: { value: string; label: string }[],
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px]">
        <SheetHeader>
          <SheetTitle>Filter Part</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4">
          {group(
            "Type",
            type,
            setType,
            TYPES.map((t) => ({
              value: t,
              label: t.charAt(0).toUpperCase() + t.slice(1),
            })),
          )}
          {group(
            "Status",
            status,
            setStatus,
            STATUSES.map((s) => ({
              value: s,
              label: s
                .split("_")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" "),
            })),
          )}
          {group(
            "Maker",
            maker,
            setMaker,
            makers.map((m) => ({ value: m, label: m })),
          )}
          {group(
            "Category",
            category,
            setCategory,
            categories.map((c) => ({ value: c, label: c })),
          )}
        </div>
        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={reset}>
            Clear all
          </Button>
          <Button className="flex-1" onClick={apply}>
            Terapkan
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
