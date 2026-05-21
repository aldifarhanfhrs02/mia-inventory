"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CreatableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  /** Called when the user adds an option not already in the list. */
  onCreate?: (value: string) => void;
  className?: string;
}

/**
 * Dropdown that also lets the user add a new option inline.
 * Used for the Unit and Project selectors.
 */
export function CreatableSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih…",
  onCreate,
  className,
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const addDraft = () => {
    const v = draft.trim();
    if (!v) return;
    if (!options.includes(v)) onCreate?.(v);
    onChange(v);
    setDraft("");
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          <div className="max-h-48 overflow-auto">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                {opt}
                {opt === value && <Check className="h-4 w-4" />}
              </button>
            ))}
            {options.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                Belum ada pilihan
              </p>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 border-t pt-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDraft();
                }
              }}
              placeholder="Tambah baru…"
              className="h-8"
            />
            <button
              type="button"
              onClick={addDraft}
              className="flex h-8 items-center gap-1 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
