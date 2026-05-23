"use client";

import {
  ArrowUpDown,
  ChevronDown,
  Download,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
  { value: "electrical", label: "Electrical" },
  { value: "mechanical", label: "Mechanical" },
  { value: "fabrication", label: "Fabrication" },
];
const SORT_OPTIONS: Option[] = [
  { value: "partName", label: "Part Name" },
  { value: "partCode", label: "Part Code" },
  { value: "maker", label: "Maker" },
  { value: "currentStock", label: "Stock" },
  { value: "price", label: "Price" },
  { value: "updatedAt", label: "Updated At" },
];

const FILTER_KEYS = ["status", "type", "maker", "category"] as const;

/** Multi-select checkbox filter dropdown with a count badge. */
function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  onReset,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 gap-1.5 rounded-lg px-3.5",
            selected.length > 0 && "border-primary text-primary",
          )}
        >
          {label}
          {selected.length > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-72 w-52 overflow-y-auto"
      >
        {selected.length > 0 && (
          <>
            <DropdownMenuItem onClick={onReset} className="text-primary">
              Reset filter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.value}
            checked={selected.includes(o.value)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => onToggle(o.value)}
          >
            {o.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface PartsToolbarProps {
  isAdmin: boolean;
  makers: string[];
  categories: string[];
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
}

/** Master Part toolbar — search, inline multi-select filters, sort, chips. */
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

  const toggleFilter = (key: string, value: string) => {
    const current = selectedOf(key);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setParam(key, next.length ? next.join(",") : null);
  };

  const sort = searchParams.get("sort") ?? "partName";
  const dir = searchParams.get("dir") === "desc" ? "desc" : "asc";
  const setSort = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", key);
    params.set("dir", sort === key && dir === "asc" ? "desc" : "asc");
    router.push(`${pathname}?${params.toString()}`);
  };

  const chips = FILTER_KEYS.flatMap((key) =>
    selectedOf(key).map((value) => ({ key, value })),
  );
  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of FILTER_KEYS) params.delete(k);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari part name, code, barcode…"
            className="h-10 rounded-lg pl-9"
          />
        </div>

        {(
          [
            { key: "status", label: "Status", options: STATUS_OPTIONS },
            { key: "type", label: "Type", options: TYPE_OPTIONS },
            {
              key: "maker",
              label: "Maker",
              options: makers.map((m) => ({ value: m, label: m })),
            },
            {
              key: "category",
              label: "Category",
              options: categories.map((c) => ({ value: c, label: c })),
            },
          ] as const
        ).map((f) => (
          <FilterDropdown
            key={f.key}
            label={f.label}
            options={f.options}
            selected={selectedOf(f.key)}
            onToggle={(value) => toggleFilter(f.key, value)}
            onReset={() => setParam(f.key, null)}
          />
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-10 gap-1.5 rounded-lg px-3.5"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort"}
              <span className="text-xs text-muted-foreground">
                {dir === "asc" ? "↑" : "↓"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {SORT_OPTIONS.map((o) => (
              <DropdownMenuItem key={o.value} onClick={() => setSort(o.value)}>
                {o.label}
                {sort === o.value && (
                  <span className="ml-auto">{dir === "asc" ? "↑" : "↓"}</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {isAdmin && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-lg px-4"
              onClick={onImport}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-lg px-4"
              onClick={onExport}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </Button>
            <Button className="h-10 rounded-lg px-4" onClick={onAdd}>
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah Part
            </Button>
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={`${c.key}-${c.value}`}
              type="button"
              onClick={() => toggleFilter(c.key, c.value)}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/70"
            >
              {c.key === "status" ? "Status" : c.key}: {c.value}
              <X className="h-3 w-3" />
            </button>
          ))}
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
