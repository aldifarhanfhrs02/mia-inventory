"use client";

import { ArrowDown, ArrowUp, FileSpreadsheet, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MovementsToolbarProps {
  isAdmin: boolean;
  onStockIn: () => void;
  onStockOut: () => void;
  onExport: () => void;
}

/** Search, type / part-type filters, date range, and IN/OUT actions. */
export function MovementsToolbar({
  isAdmin,
  onStockIn,
  onStockOut,
  onExport,
}: MovementsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (search === current) return;
    const t = setTimeout(() => setParam("search", search.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari part, requestor, project…"
            className="pl-8"
          />
        </div>

        <Select
          value={searchParams.get("type") ?? "all"}
          onValueChange={(v) => setParam("type", v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="IN">Stock IN</SelectItem>
            <SelectItem value="OUT">Stock OUT</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("partType") ?? "all"}
          onValueChange={(v) => setParam("partType", v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Part Type</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="mechanical">Mechanical</SelectItem>
            <SelectItem value="fabrication">Fabrication</SelectItem>
          </SelectContent>
        </Select>

        {isAdmin && (
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onExport}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              className="border-chart-2 text-chart-2 hover:bg-chart-2/10"
              onClick={onStockIn}
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Stock IN
            </Button>
            <Button
              variant="outline"
              className="border-chart-4 text-chart-4 hover:bg-chart-4/10"
              onClick={onStockOut}
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              Stock OUT
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Periode:</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setParam("dateFrom", e.target.value)}
          className="h-8 w-[160px] font-mono text-xs"
        />
        <span className="text-muted-foreground">s/d</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setParam("dateTo", e.target.value)}
          className="h-8 w-[160px] font-mono text-xs"
        />
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("dateFrom");
              params.delete("dateTo");
              params.delete("page");
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Reset tanggal
          </button>
        )}
      </div>
    </div>
  );
}
