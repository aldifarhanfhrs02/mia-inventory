"use client";

import {
  ArrowDownToLine,
  FileSpreadsheet,
  Filter,
  Plus,
  Search,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";
import { PartsFilterDialog } from "./parts-filter-dialog";

const ARRAY_KEYS = ["status", "type", "maker", "category"] as const;
const DATE_KEYS = ["updatedFrom", "updatedTo"] as const;

/** Pretty label for an active filter chip. */
const FILTER_LABEL: Record<string, string> = {
  status: "Status",
  type: "Type",
  maker: "Maker",
  category: "Category",
};

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
  unassigned: "Unassigned",
  inactive: "Inactive",
};

interface PartsToolbarProps {
  isAdmin: boolean;
  makers: string[];
  categories: string[];
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
}

/** Master Part toolbar — search, one "Filter" button (all filters), sort, chips. */
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
  const [filterOpen, setFilterOpen] = useState(false);

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

  // Active filter chips — array filters + the date range.
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

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari part name, code, barcode…"
            className="h-10 rounded-lg pl-9"
          />
        </div>

        {/* SINGLE FILTER BUTTON — opens the all-filters dialog */}
        <Button
          variant="outline"
          onClick={() => setFilterOpen(true)}
          className={cn(
            "h-10 gap-1.5 rounded-lg px-3.5",
            totalActive > 0 && "border-primary text-primary",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
          {totalActive > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {totalActive}
            </span>
          )}
        </Button>

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
              Tambah Part
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
              {FILTER_LABEL[c.key] ?? c.key}:{" "}
              {c.key === "status" ? (STATUS_LABEL[c.value] ?? c.value) : c.value}
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

      <PartsFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        makers={makers}
        categories={categories}
      />
    </div>
  );
}
