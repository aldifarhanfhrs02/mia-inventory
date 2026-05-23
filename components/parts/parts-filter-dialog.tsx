"use client";

import {
  CalendarDays,
  CircleDot,
  Factory,
  Filter,
  Layers,
  RotateCcw,
  Tag,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

const STATUS_OPTIONS: Option[] = [
  { value: "available", label: "Available" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "unassigned", label: "Unassigned" },
  { value: "inactive", label: "Inactive" },
];

const TYPE_OPTIONS: Option[] = [
  { value: "Electrical", label: "Electrical" },
  { value: "Mechanical", label: "Mechanical" },
  { value: "Fabrication", label: "Fabrication" },
];

const ARRAY_KEYS = ["status", "type", "maker", "category"] as const;
const DATE_KEYS = ["updatedFrom", "updatedTo"] as const;
const ALL_KEYS = [...ARRAY_KEYS, ...DATE_KEYS];

interface PartsFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  makers: string[];
  categories: string[];
}

/** Single dialog gathering every Master Part filter — Status / Type / Maker /
 *  Category / Updated date range. Live-syncs to the URL so the table updates
 *  underneath in real-time. */
export function PartsFilterDialog({
  open,
  onOpenChange,
  makers,
  categories,
}: PartsFilterDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const selectedOf = (key: string): string[] => {
    const raw = searchParams.get(key);
    return raw ? raw.split(",").filter(Boolean) : [];
  };

  const toggle = (key: string, value: string) => {
    const current = selectedOf(key);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setParam(key, next.length ? next.join(",") : null);
  };

  const updatedFrom = searchParams.get("updatedFrom") ?? "";
  const updatedTo = searchParams.get("updatedTo") ?? "";

  const resetAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of ALL_KEYS) params.delete(k);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6 text-left">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Filter Master Part</DialogTitle>
              <DialogDescription className="text-xs">
                Persempit daftar part berdasarkan status, tipe, maker, kategori,
                atau tanggal update.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <FilterSection icon={CircleDot} title="Status">
            <CheckboxGrid
              options={STATUS_OPTIONS}
              selected={selectedOf("status")}
              onToggle={(v) => toggle("status", v)}
            />
          </FilterSection>

          <FilterSection icon={Layers} title="Type">
            <CheckboxGrid
              options={TYPE_OPTIONS}
              selected={selectedOf("type")}
              onToggle={(v) => toggle("type", v)}
            />
          </FilterSection>

          <FilterSection icon={Factory} title="Maker">
            {makers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Belum ada maker terdaftar.
              </p>
            ) : (
              <CheckboxGrid
                options={makers.map((m) => ({ value: m, label: m }))}
                selected={selectedOf("maker")}
                onToggle={(v) => toggle("maker", v)}
              />
            )}
          </FilterSection>

          <FilterSection icon={Tag} title="Category">
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Belum ada kategori terdaftar.
              </p>
            ) : (
              <CheckboxGrid
                options={categories.map((c) => ({ value: c, label: c }))}
                selected={selectedOf("category")}
                onToggle={(v) => toggle("category", v)}
              />
            )}
          </FilterSection>

          <FilterSection icon={CalendarDays} title="Terakhir Diupdate">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Dari</Label>
                <Input
                  type="date"
                  value={updatedFrom}
                  max={updatedTo || undefined}
                  onChange={(e) =>
                    setParam("updatedFrom", e.target.value || null)
                  }
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sampai</Label>
                <Input
                  type="date"
                  value={updatedTo}
                  min={updatedFrom || undefined}
                  onChange={(e) =>
                    setParam("updatedTo", e.target.value || null)
                  }
                  className="tabular-nums"
                />
              </div>
            </div>
            {(updatedFrom || updatedTo) && (
              <button
                type="button"
                onClick={() => {
                  setParam("updatedFrom", null);
                  setParam("updatedTo", null);
                }}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                Reset tanggal
              </button>
            )}
          </FilterSection>
        </div>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/20 px-6 py-3">
          <Button variant="ghost" onClick={resetAll}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset Semua
          </Button>
          <Button onClick={() => onOpenChange(false)}>Selesai</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function CheckboxGrid({
  options,
  selected,
  onToggle,
}: {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        options.length > 6
          ? "max-h-44 grid-cols-2 overflow-y-auto rounded-md border p-2"
          : "grid-cols-2",
      )}
    >
      {options.map((o) => {
        const checked = selected.includes(o.value);
        return (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
              checked
                ? "border-primary bg-primary/5 text-foreground"
                : "border-transparent hover:bg-accent/30",
            )}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={() => onToggle(o.value)}
            />
            <span className="truncate">{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}
