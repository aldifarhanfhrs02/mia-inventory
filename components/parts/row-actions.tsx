"use client";

import { MoreHorizontal } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deletePart, setPartActive } from "@/lib/actions/parts.actions";
import type { PartWithStock } from "@/lib/types";

interface RowActionsProps {
  part: PartWithStock;
  isAdmin: boolean;
  onView: (part: PartWithStock) => void;
  onEdit: (part: PartWithStock) => void;
}

/** Per-row "⋯" dropdown for the parts table. */
export function RowActions({ part, isAdmin, onView, onEdit }: RowActionsProps) {
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.ok) toast.success(ok);
      else toast.error(res.error ?? "Terjadi kesalahan");
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-md p-1 hover:bg-accent"
        aria-label="Aksi"
        disabled={pending}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(part)}>
          Lihat Detail
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={() => onEdit(part)}>
              Edit Part
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                run(
                  () => setPartActive(part.id, part.status === "inactive"),
                  part.status === "inactive"
                    ? "Part diaktifkan"
                    : "Part dinonaktifkan",
                )
              }
            >
              {part.status === "inactive" ? "Aktifkan" : "Nonaktifkan"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => run(() => deletePart(part.id), "Part dihapus")}
            >
              Hapus
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
