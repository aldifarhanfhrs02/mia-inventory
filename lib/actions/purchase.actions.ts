"use server";

import { eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { activityLogs, parts, purchaseRecords } from "@/lib/db/schema";
import { getServerSession, isAdmin } from "@/lib/auth/session";
import { formatStorageAddr } from "@/lib/utils/barcode";
import type { ActionResult } from "@/lib/types";

interface CreatePurchaseInput {
  partId: string;
  supplier: string;
  qtyOrdered: number;
  expectedArrival?: string;
  poNumber?: string;
  notes?: string;
}

/** Create a purchase request for a part. Admin only. */
export async function createPurchase(
  input: CreatePurchaseInput,
): Promise<ActionResult<null>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  if (!input.supplier.trim()) {
    return { ok: false, error: "Supplier is required" };
  }
  if (!(input.qtyOrdered > 0)) {
    return { ok: false, error: "Quantity must be greater than 0" };
  }

  const [part] = await db.select().from(parts).where(eq(parts.id, input.partId));
  if (!part) return { ok: false, error: "Part not found" };

  try {
    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(purchaseRecords)
        .values({
          partId: input.partId,
          requestDate: new Date(),
          status: "requested",
          supplier: input.supplier.trim(),
          poNumber: input.poNumber?.trim() || null,
          qtyOrdered: input.qtyOrdered,
          expectedArrival: input.expectedArrival
            ? new Date(input.expectedArrival)
            : null,
          notes: input.notes?.trim() || null,
          createdBy: session.user.id,
        })
        .returning({ id: purchaseRecords.id });
      await tx.insert(activityLogs).values({
        userId: session.user.id,
        action: "CREATE_PURCHASE",
        entityType: "Purchase",
        entityId: created.id,
        changes: {
          after: {
            partCode: part.partCode,
            supplier: input.supplier,
            qty: input.qtyOrdered,
          },
        },
      });
    });
    revalidatePath("/parts");
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Failed to save purchase request" };
  }
}

export interface StorageHistoryRow {
  partCode: string;
  partName: string;
  status: "active" | "inactive" | "unassigned";
  barcode: string | null;
}

/**
 * Usage history for a storage address — derived from the parts currently or
 * previously placed there (no dedicated history table in this build).
 */
export async function getStorageHistory(addr: string): Promise<{
  current: StorageHistoryRow | null;
  history: StorageHistoryRow[];
}> {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const rows = await db
    .select({
      partCode: parts.partCode,
      partName: parts.partName,
      status: parts.status,
      barcode: parts.barcode,
      storageType: parts.storageType,
      storageNumber: parts.storageNumber,
      storageBox: parts.storageBox,
      storageBoxKecil: parts.storageBoxKecil,
    })
    .from(parts)
    .where(isNull(parts.deletedAt));

  const here = rows
    .filter(
      (r) =>
        formatStorageAddr(
          r.storageType,
          r.storageNumber,
          r.storageBox,
          r.storageBoxKecil,
        ) === addr,
    )
    .map((r) => ({
      partCode: r.partCode,
      partName: r.partName,
      status: r.status,
      barcode: r.barcode,
    }));

  return {
    current: here.find((r) => r.status === "active") ?? null,
    history: here,
  };
}
