"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { TypeBadge } from "@/components/shared/type-badge";
import { RowActions } from "./row-actions";
import type { PartWithStock } from "@/lib/types";

interface ColumnContext {
  startIndex: number;
  isAdmin: boolean;
  onView: (part: PartWithStock) => void;
  onEdit: (part: PartWithStock) => void;
}

/** TanStack column definitions for the Master Part table. */
export function getPartColumns({
  startIndex,
  isAdmin,
  onView,
  onEdit,
}: ColumnContext): ColumnDef<PartWithStock>[] {
  return [
    {
      id: "no",
      header: "No",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {startIndex + row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "partName",
      header: "Part Name",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onView(row.original)}
          className="text-left font-medium text-primary hover:underline"
        >
          {row.original.partName}
        </button>
      ),
    },
    {
      accessorKey: "partCode",
      header: "Part Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.partCode}</span>
      ),
    },
    { accessorKey: "maker", header: "Maker" },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
    },
    {
      accessorKey: "storageAddr",
      header: "Storage",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.storageAddr}</span>
      ),
    },
    {
      accessorKey: "currentStock",
      header: "Stock",
      cell: ({ row }) => (
        <span className="font-mono font-semibold tabular-nums">
          {row.original.currentStock}
        </span>
      ),
    },
    { accessorKey: "unit", header: "Unit" },
    {
      accessorKey: "stockStatus",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          status={
            row.original.status === "inactive"
              ? "inactive"
              : row.original.stockStatus
          }
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          part={row.original}
          isAdmin={isAdmin}
          onView={onView}
          onEdit={onEdit}
        />
      ),
    },
  ];
}
