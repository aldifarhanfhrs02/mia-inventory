"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────── */
/* FilterButton — popover trigger with chevron + active count badge.           */
/* ────────────────────────────────────────────────────────────────────────── */

interface FilterButtonProps {
  label: string;
  count: number;
  children: React.ReactNode;
  /** Width override for the popover content. Default 240px. */
  contentClassName?: string;
}

export function FilterButton({
  label,
  count,
  children,
  contentClassName,
}: FilterButtonProps) {
  const active = count > 0;
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent/50",
          active && "border-primary text-primary",
        )}
      >
        <span>{label}</span>
        {active && (
          <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
            {count}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </PopoverTrigger>
      <PopoverContent className={cn("w-64", contentClassName)} align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* CheckboxPopoverContent — multi-select option list with optional search.     */
/* Use inside <FilterButton>.                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxPopoverContentProps {
  options: CheckboxOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onReset: () => void;
  /** Force-enable the search input. Auto-enabled when options.length > 8. */
  searchable?: boolean;
  /** Shown when no options match the search or list is empty. */
  emptyHint?: string;
}

export function CheckboxPopoverContent({
  options,
  selected,
  onToggle,
  onReset,
  searchable,
  emptyHint = "No options.",
}: CheckboxPopoverContentProps) {
  const [query, setQuery] = useState("");
  const showSearch = searchable ?? options.length > 8;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const hasSelection = selected.length > 0;

  return (
    <div className="space-y-2">
      {showSearch && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-8 pl-8 text-sm"
          />
        </div>
      )}

      <div className="max-h-60 space-y-0.5 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-1 py-2 text-xs text-muted-foreground">{emptyHint}</p>
        )}
        {filtered.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/40",
                checked && "bg-primary/5",
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggle(opt.value)}
              />
              <span className="truncate">{opt.label}</span>
            </label>
          );
        })}
      </div>

      {hasSelection && (
        <div className="border-t pt-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <X className="h-3 w-3" />
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* DateRangePopoverContent — two date inputs (from / to) with reset.           */
/* ────────────────────────────────────────────────────────────────────────── */

interface DateRangePopoverContentProps {
  from: string;
  to: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
  onReset: () => void;
}

export function DateRangePopoverContent({
  from,
  to,
  onChangeFrom,
  onChangeTo,
  onReset,
}: DateRangePopoverContentProps) {
  const hasValue = !!from || !!to;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">From</Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => onChangeFrom(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">To</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onChangeTo(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      {hasValue && (
        <div className="border-t pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 gap-1 px-2 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
          >
            <X className="h-3 w-3" />
            Reset dates
          </Button>
        </div>
      )}
    </div>
  );
}
