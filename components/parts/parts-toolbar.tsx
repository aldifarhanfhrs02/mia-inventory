"use client";

import { Filter, Plus, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PartsToolbarProps {
  isAdmin: boolean;
  onAdd: () => void;
  onOpenFilter: () => void;
}

const FILTER_KEYS = ["type", "status", "maker", "category"] as const;

/** Search input, filter button, active filter chips, and "Tambah Part". */
export function PartsToolbar({
  isAdmin,
  onAdd,
  onOpenFilter,
}: PartsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  // Debounce the search input into the URL.
  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (search === current) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) params.set("search", search.trim());
      else params.delete("search");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(t);
  }, [search, searchParams, pathname, router]);

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const activeFilters = FILTER_KEYS.map((k) => ({
    key: k,
    value: searchParams.get(k),
  })).filter((f) => f.value && f.value !== "all");

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kode, maker, lokasi…"
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={onOpenFilter}>
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        {isAdmin && (
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Part
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => clearFilter(f.key)}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/70"
            >
              {f.key}: {f.value}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
