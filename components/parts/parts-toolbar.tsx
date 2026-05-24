"use client";

import {
  ArrowDownToLine,
  FileSpreadsheet,
  Plus,
  Search,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils/format";
import {
  CheckboxPopoverContent,
  DateRangePopoverContent,
  FilterButton,
  type CheckboxOption,
} from "./filter-popovers";

const ARRAY_KEYS = [
  "status",
  "type",
  "partClass",
  "maker",
  "category",
] as const;
const DATE_KEYS = ["updatedFrom", "updatedTo"] as const;

/** Pretty label for an active filter chip in the secondary row. */
const FILTER_LABEL: Record<string, string> = {
  status: "Status",
  type: "Type",
  partClass: "Source",
  maker: "Maker",
  category: "Category",
};

const STATUS_OPTIONS: CheckboxOption[] = [
  { value: "available", label: "Available" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "unassigned", label: "Unassigned" },
  { value: "inactive", label: "Inactive" },
];

const TYPE_OPTIONS: CheckboxOption[] = [
  { value: "Electrical", label: "Electrical" },
  { value: "Mechanical", label: "Mechanical" },
  { value: "Fabrication", label: "Fabrication" },
];

const SOURCE_OPTIONS: CheckboxOption[] = [
  { value: "consumable", label: "Consumable" },
  { value: "existing_project", label: "Existing Project" },
];

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
);
const SOURCE_LABEL: Record<string, string> = Object.fromEntries(
  SOURCE_OPTIONS.map((o) => [o.value, o.label]),
);

interface PartsToolbarProps {
  isAdmin: boolean;
  makers: string[];
  categories: string[];
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
}

/** Master Part toolbar — search + 6 inline popover filters + admin actions. */
export function PartsToolbar({
  isAdmin,
  makers,
  categories,
  onAdd,
  onImport,
  onExport,
}: PartsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Debounce search → URL.
  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (search === current) return;
    const t = setTimeout(() => setParam("search", search.trim() || null), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const selectedOf = (key: string): string[] => {
    const raw = searchParams.get(key);
    return raw ? raw.split(",").filter(Boolean) : [];
  };

  const toggleFilterValue = (key: string, value: string) => {
    const current = selectedOf(key);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setParam(key, next.length ? next.join(",") : null);
  };

  const resetKey = (key: string) => setParam(key, null);

  // Active chips for the secondary row.
  const updatedFrom = searchParams.get("updatedFrom") ?? "";
  const updatedTo = searchParams.get("updatedTo") ?? "";
  const arrayChips = ARRAY_KEYS.flatMap((key) =>
    selectedOf(key).map((value) => ({ key, value })),
  );
  const totalActive =
    arrayChips.length + (updatedFrom ? 1 : 0) + (updatedTo ? 1 : 0);

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of ARRAY_KEYS) params.delete(k);
    for (const k of DATE_KEYS) params.delete(k);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  /** Render the human-readable value of an active array-filter chip. */
  const chipValueLabel = (key: string, value: string): string => {
    if (key === "status") return STATUS_LABEL[value] ?? value;
    if (key === "partClass") return SOURCE_LABEL[value] ?? value;
    return value;
  };

  const makerOptions: CheckboxOption[] = makers.map((m) => ({
    value: m,
    label: m,
  }));
  const categoryOptions: CheckboxOption[] = categories.map((c) => ({
    value: c,
    label: c,
  }));

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search part name, code, barcode…"
            className="h-10 rounded-lg pl-9"
          />
        </div>

        {/* Inline popover filters. */}
        <FilterButton label="Status" count={selectedOf("status").length}>
          <CheckboxPopoverContent
            options={STATUS_OPTIONS}
            selected={selectedOf("status")}
            onToggle={(v) => toggleFilterValue("status", v)}
            onReset={() => resetKey("status")}
          />
        </FilterButton>

        <FilterButton label="Type" count={selectedOf("type").length}>
          <CheckboxPopoverContent
            options={TYPE_OPTIONS}
            selected={selectedOf("type")}
            onToggle={(v) => toggleFilterValue("type", v)}
            onReset={() => resetKey("type")}
          />
        </FilterButton>

        <FilterButton label="Source" count={selectedOf("partClass").length}>
          <CheckboxPopoverContent
            options={SOURCE_OPTIONS}
            selected={selectedOf("partClass")}
            onToggle={(v) => toggleFilterValue("partClass", v)}
            onReset={() => resetKey("partClass")}
          />
        </FilterButton>

        <FilterButton label="Maker" count={selectedOf("maker").length}>
          <CheckboxPopoverContent
            options={makerOptions}
            selected={selectedOf("maker")}
            onToggle={(v) => toggleFilterValue("maker", v)}
            onReset={() => resetKey("maker")}
            emptyHint="No makers registered yet"
          />
        </FilterButton>

        <FilterButton
          label="Category"
          count={selectedOf("category").length}
        >
          <CheckboxPopoverContent
            options={categoryOptions}
            selected={selectedOf("category")}
            onToggle={(v) => toggleFilterValue("category", v)}
            onReset={() => resetKey("category")}
            emptyHint="No categories registered yet"
          />
        </FilterButton>

        <FilterButton
          label="Diupdate"
          count={(updatedFrom ? 1 : 0) + (updatedTo ? 1 : 0)}
        >
          <DateRangePopoverContent
            from={updatedFrom}
            to={updatedTo}
            onChangeFrom={(v) => setParam("updatedFrom", v || null)}
            onChangeTo={(v) => setParam("updatedTo", v || null)}
            onReset={() => {
              const params = new URLSearchParams(searchParams.toString());
              for (const k of DATE_KEYS) params.delete(k);
              params.delete("page");
              router.push(`${pathname}?${params.toString()}`);
            }}
          />
        </FilterButton>

        {isAdmin && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-lg px-4"
              onClick={onImport}
            >
              <ArrowDownToLine className="mr-1.5 h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-lg px-4"
              onClick={onExport}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              Export
            </Button>
            <Button className="h-10 rounded-lg px-4" onClick={onAdd}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Part
            </Button>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {totalActive > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {arrayChips.map((c) => (
            <button
              key={`${c.key}-${c.value}`}
              type="button"
              onClick={() => toggleFilterValue(c.key, c.value)}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/70"
            >
              {FILTER_LABEL[c.key] ?? c.key}: {chipValueLabel(c.key, c.value)}
              <X className="h-3 w-3" />
            </button>
          ))}
          {updatedFrom && (
            <button
              type="button"
              onClick={() => setParam("updatedFrom", null)}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/70"
            >
              Updated ≥ {formatDate(updatedFrom)}
              <X className="h-3 w-3" />
            </button>
          )}
          {updatedTo && (
            <button
              type="button"
              onClick={() => setParam("updatedTo", null)}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/70"
            >
              Updated ≤ {formatDate(updatedTo)}
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="px-2 text-xs font-medium text-primary hover:underline"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
