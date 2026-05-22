"use client";

import {
  ArrowDown,
  ArrowUp,
  MapPin,
  MoreHorizontal,
  Pencil,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setPartActive } from "@/lib/actions/parts.actions";
import type { PartTableRow } from "@/lib/actions/parts.actions";

interface RowActionsProps {
  part: PartTableRow;
  isAdmin: boolean;
  onView: (part: PartTableRow) => void;
  onEdit: (part: PartTableRow) => void;
  onAssign: (part: PartTableRow) => void;
  onPurchase: (part: PartTableRow) => void;
}

/** Per-row "⋯" menu — mirrors the prototype's RowActions. */
export function RowActions({
  part,
  isAdmin,
  onView,
  onEdit,
  onAssign,
  onPurchase,
}: RowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isLowOrOut =
    part.stockStatus === "low_stock" || part.stockStatus === "out_of_stock";

  const deactivate = () =>
    startTransition(async () => {
      const res = await setPartActive(part.id, false);
      if (res.ok) toast.success("Part dinonaktifkan");
      else toast.error(res.error ?? "Gagal");
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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView(part)}>
          <Search className="mr-2 h-4 w-4" />
          Lihat Detail
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={() => onEdit(part)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Part
          </DropdownMenuItem>
        )}
        {isAdmin && part.status === "unassigned" && (
          <DropdownMenuItem onClick={() => onAssign(part)}>
            <MapPin className="mr-2 h-4 w-4 text-chart-1" />
            Assign Lokasi
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/movements")}>
          <ArrowUp className="mr-2 h-4 w-4 text-chart-2" />
          Stock IN
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/movements")}>
          <ArrowDown className="mr-2 h-4 w-4 text-chart-4" />
          Stock OUT
        </DropdownMenuItem>
        {isAdmin && isLowOrOut && (
          <DropdownMenuItem onClick={() => onPurchase(part)}>
            <ShoppingCart className="mr-2 h-4 w-4 text-primary" />
            Purchase Part
          </DropdownMenuItem>
        )}
        {isAdmin && part.status === "active" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={deactivate}
            >
              <X className="mr-2 h-4 w-4" />
              Nonaktifkan
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
