"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PartWithStock } from "@/lib/types";
import { getPartColumns } from "./columns";

interface PartsTableProps {
  data: PartWithStock[];
  startIndex: number;
  isAdmin: boolean;
  onView: (part: PartWithStock) => void;
  onEdit: (part: PartWithStock) => void;
}

/** TanStack-backed Master Part table. */
export function PartsTable({
  data,
  startIndex,
  isAdmin,
  onView,
  onEdit,
}: PartsTableProps) {
  const columns = useMemo(
    () => getPartColumns({ startIndex, isAdmin, onView, onEdit }),
    [startIndex, isAdmin, onView, onEdit],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Tidak ada part yang cocok.
              </TableCell>
            </TableRow>
          )}
          {table.getRowModel().rows.map((row) => {
            const p = row.original;
            return (
              <TableRow
                key={row.id}
                className={cn(
                  p.status === "unassigned" &&
                    "border-l-2 border-dashed border-l-chart-3 bg-chart-3/5",
                  p.status === "inactive" && "opacity-55",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
