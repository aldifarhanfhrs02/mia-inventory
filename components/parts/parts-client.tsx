"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pagination } from "@/components/shared/pagination";
import { getPartDetail } from "@/lib/actions/parts.actions";
import type { PartWithStock } from "@/lib/types";
import { FilterSheet } from "./filter-sheet";
import { PartDetailSheet, type PartDetail } from "./part-detail-sheet";
import { PartFormSheet } from "./part-form-sheet";
import { PartsTable } from "./parts-table";
import { PartsToolbar } from "./parts-toolbar";

interface PartsClientProps {
  rows: PartWithStock[];
  total: number;
  page: number;
  pageSize: number;
  isAdmin: boolean;
  makers: string[];
  categories: string[];
}

/** Orchestrates the Master Part toolbar, table, pagination, and sheets. */
export function PartsClient({
  rows,
  total,
  page,
  pageSize,
  isAdmin,
  makers,
  categories,
}: PartsClientProps) {
  const [detail, setDetail] = useState<PartDetail | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editPart, setEditPart] = useState<PartWithStock | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Fetch detail in the click handler (an event) — no setState-in-effect.
  const openDetail = (part: PartWithStock) => {
    startTransition(async () => {
      const d = await getPartDetail(part.id);
      if (d) setDetail(d);
      else toast.error("Part tidak ditemukan");
    });
  };

  return (
    <>
      <PartsToolbar
        isAdmin={isAdmin}
        onAdd={() => {
          setEditPart(null);
          setFormOpen(true);
        }}
        onOpenFilter={() => setFilterOpen(true)}
      />

      <PartsTable
        data={rows}
        startIndex={(page - 1) * pageSize}
        isAdmin={isAdmin}
        onView={openDetail}
        onEdit={(p) => {
          setEditPart(p);
          setFormOpen(true);
        }}
      />

      <Pagination page={page} pageSize={pageSize} total={total} />

      <PartDetailSheet
        detail={detail}
        onOpenChange={(open) => !open && setDetail(null)}
      />
      <PartFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        editPart={editPart}
      />
      <FilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        makers={makers}
        categories={categories}
      />
    </>
  );
}
