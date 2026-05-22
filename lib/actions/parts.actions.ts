"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  activityLogs,
  parts,
  purchaseRecords,
  stockMovements,
  users,
} from "@/lib/db/schema";
import { getServerSession, isAdmin } from "@/lib/auth/session";
import { CreatePartSchema, UpdatePartSchema } from "@/lib/validations/parts.schema";
import { generateBarcode, formatStorageAddr } from "@/lib/utils/barcode";
import { computeStockStatus } from "@/lib/utils/stock";
import type {
  ActionResult,
  ActivityAction,
  CreatePartInput,
  PartWithStock,
  PurchaseRecord,
  StockMovement,
  UpdatePartInput,
} from "@/lib/types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface GetPartsParams {
  search?: string;
  type?: string;
  status?: string;
  maker?: string;
  category?: string;
  page?: number;
  sort?: string;
  dir?: "asc" | "desc";
}

const PAGE_SIZE = 15;

/** Fetch a part row decorated with computed current stock + status. */
async function loadPartsWithStock(): Promise<PartWithStock[]> {
  const rows = await db.execute(sql`
    SELECT
      p.*,
      COALESCE(SUM(CASE WHEN sm.type IN ('INITIAL','IN') THEN sm.quantity ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0)
        AS current_stock
    FROM parts p
    LEFT JOIN stock_movements sm ON sm.part_id = p.id
    WHERE p.deleted_at IS NULL
    GROUP BY p.id
  `);

  return (rows.rows as unknown as Record<string, unknown>[]).map((r) => {
    const currentStock = Number(r.current_stock ?? 0);
    const minStock = Number(r.min_stock ?? 0);
    const status = r.status as PartWithStock["status"];
    return {
      id: String(r.id),
      partCode: String(r.part_code),
      partName: String(r.part_name),
      maker: String(r.maker),
      type: r.type as PartWithStock["type"],
      category: String(r.category),
      unit: r.unit as PartWithStock["unit"],
      description: (r.description as string | null) ?? null,
      remarks: (r.remarks as string | null) ?? null,
      storageType: (r.storage_type as PartWithStock["storageType"]) ?? null,
      storageNumber: (r.storage_number as number | null) ?? null,
      storageBox: (r.storage_box as number | null) ?? null,
      storageBoxKecil: (r.storage_box_kecil as number | null) ?? null,
      barcode: (r.barcode as string | null) ?? null,
      minStock,
      stdStock: (r.std_stock as number | null) ?? null,
      maxStock: (r.max_stock as number | null) ?? null,
      status,
      deletedAt: null,
      createdBy: (r.created_by as string | null) ?? null,
      updatedBy: (r.updated_by as string | null) ?? null,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
      currentStock,
      stockStatus: computeStockStatus(status, currentStock, minStock),
      storageAddr: formatStorageAddr(
        (r.storage_type as string | null) ?? null,
        (r.storage_number as number | null) ?? null,
        (r.storage_box as number | null) ?? null,
        (r.storage_box_kecil as number | null) ?? null,
      ),
    };
  });
}

/** Server-side filtered, sorted, paginated parts list. */
export async function getParts(params: GetPartsParams): Promise<{
  rows: PartWithStock[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  let rows = await loadPartsWithStock();
  const {
    search = "",
    type = "all",
    status = "all",
    maker = "all",
    category = "all",
    page = 1,
    sort = "partName",
    dir = "asc",
  } = params;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter((p) =>
      [p.partName, p.partCode, p.maker, p.storageAddr, p.category]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  if (type !== "all") rows = rows.filter((p) => p.type === type);
  if (maker !== "all") rows = rows.filter((p) => p.maker === maker);
  if (category !== "all") rows = rows.filter((p) => p.category === category);
  if (status !== "all") {
    rows =
      status === "inactive"
        ? rows.filter((p) => p.status === "inactive")
        : rows.filter(
            (p) => p.status !== "inactive" && p.stockStatus === status,
          );
  }

  rows.sort((a, b) => {
    const av = a[sort as keyof PartWithStock];
    const bv = b[sort as keyof PartWithStock];
    let cmp = 0;
    if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv));
    return dir === "asc" ? cmp : -cmp;
  });

  const total = rows.length;
  const start = (page - 1) * PAGE_SIZE;
  return {
    rows: rows.slice(start, start + PAGE_SIZE),
    total,
    page,
    pageSize: PAGE_SIZE,
  };
}

/** Distinct makers and categories for the filter sheet. */
export async function getFilterOptions(): Promise<{
  makers: string[];
  categories: string[];
}> {
  const rows = await loadPartsWithStock();
  return {
    makers: [...new Set(rows.map((r) => r.maker))].sort(),
    categories: [...new Set(rows.map((r) => r.category))].sort(),
  };
}

/** Part detail with its purchase records and movement history. */
export async function getPartDetail(id: string): Promise<{
  part: PartWithStock;
  purchases: PurchaseRecord[];
  movements: StockMovement[];
} | null> {
  const all = await loadPartsWithStock();
  const part = all.find((p) => p.id === id);
  if (!part) return null;

  const purchases = (await db
    .select()
    .from(purchaseRecords)
    .where(eq(purchaseRecords.partId, id))) as unknown as PurchaseRecord[];
  const movements = (await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.partId, id))) as unknown as StockMovement[];

  return { part, purchases, movements };
}

/** Insert an activity-log row. Call inside the mutation's transaction. */
async function logActivity(
  tx: Tx,
  userId: string,
  action: ActivityAction,
  entityId: string,
  changes: Record<string, unknown>,
) {
  await tx.insert(activityLogs).values({
    userId,
    action,
    entityType: "Part",
    entityId,
    changes,
  });
}

/** Create a part (+ INITIAL movement if initial stock > 0). Admin only. */
export async function createPart(
  input: CreatePartInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const parsed = CreatePartSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const dup = await db
    .select({ id: parts.id })
    .from(parts)
    .where(eq(parts.partCode, v.partCode));
  if (dup.length > 0) {
    return { ok: false, error: "Part Code sudah ada di database" };
  }

  const hasLocation = !!v.storageType;
  const barcode = hasLocation
    ? generateBarcode(
        v.storageType!,
        v.storageNumber!,
        v.storageBox!,
        v.storageBoxKecil!,
      )
    : null;

  try {
    const id = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(parts)
        .values({
          partCode: v.partCode,
          partName: v.partName,
          maker: v.maker,
          type: v.type,
          category: v.category,
          unit: v.unit as never,
          description: v.description ?? null,
          remarks: v.remarks ?? null,
          storageType: v.storageType ?? null,
          storageNumber: v.storageNumber ?? null,
          storageBox: v.storageBox ?? null,
          storageBoxKecil: v.storageBoxKecil ?? null,
          barcode,
          minStock: v.minStock,
          stdStock: v.stdStock ?? null,
          maxStock: v.maxStock ?? null,
          status: hasLocation ? "active" : "unassigned",
          createdBy: session.user.id,
          updatedBy: session.user.id,
        })
        .returning({ id: parts.id });

      if (v.initialStock > 0) {
        await tx.insert(stockMovements).values({
          partId: created.id,
          type: "INITIAL",
          quantity: v.initialStock,
          stockBefore: 0,
          stockAfter: v.initialStock,
          requestor: session.user.fullName,
          inputerNik: session.user.nik,
        });
      }
      await logActivity(tx, session.user.id, "CREATE", created.id, {
        after: { partCode: v.partCode, partName: v.partName },
      });
      return created.id;
    });
    revalidatePath("/parts");
    return { ok: true, data: { id } };
  } catch {
    return { ok: false, error: "Gagal menyimpan part" };
  }
}

/** Update a part's identity/stock/location fields. Admin only. */
export async function updatePart(
  id: string,
  input: UpdatePartInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const parsed = UpdatePartSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const existing = await db.select().from(parts).where(eq(parts.id, id));
  if (existing.length === 0) return { ok: false, error: "Part tidak ditemukan" };

  const dup = await db
    .select({ id: parts.id })
    .from(parts)
    .where(eq(parts.partCode, v.partCode));
  if (dup.some((d) => d.id !== id)) {
    return { ok: false, error: "Part Code sudah dipakai part lain" };
  }

  const hasLocation = !!v.storageType;
  const barcode = hasLocation
    ? generateBarcode(
        v.storageType!,
        v.storageNumber!,
        v.storageBox!,
        v.storageBoxKecil!,
      )
    : null;

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(parts)
        .set({
          partCode: v.partCode,
          partName: v.partName,
          maker: v.maker,
          type: v.type,
          category: v.category,
          unit: v.unit as never,
          description: v.description ?? null,
          remarks: v.remarks ?? null,
          storageType: v.storageType ?? null,
          storageNumber: v.storageNumber ?? null,
          storageBox: v.storageBox ?? null,
          storageBoxKecil: v.storageBoxKecil ?? null,
          barcode,
          minStock: v.minStock,
          stdStock: v.stdStock ?? null,
          maxStock: v.maxStock ?? null,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(parts.id, id));
      await logActivity(tx, session.user.id, "UPDATE", id, {
        after: { partCode: v.partCode, partName: v.partName },
      });
    });
    revalidatePath("/parts");
    return { ok: true, data: { id } };
  } catch {
    return { ok: false, error: "Gagal memperbarui part" };
  }
}

/** Toggle a part between active and inactive (soft, reversible). Admin only. */
export async function setPartActive(
  id: string,
  active: boolean,
): Promise<ActionResult<null>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const existing = await db.select().from(parts).where(eq(parts.id, id));
  if (existing.length === 0) return { ok: false, error: "Part tidak ditemukan" };

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(parts)
        .set({
          status: active
            ? existing[0].storageType
              ? "active"
              : "unassigned"
            : "inactive",
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(parts.id, id));
      await logActivity(
        tx,
        session.user.id,
        active ? "REACTIVATE" : "DEACTIVATE",
        id,
        { before: { partCode: existing[0].partCode } },
      );
    });
    revalidatePath("/parts");
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Gagal mengubah status part" };
  }
}

/** Soft-delete a part (deleted_at = now). Admin only. */
export async function deletePart(id: string): Promise<ActionResult<null>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const existing = await db
    .select()
    .from(parts)
    .where(and(eq(parts.id, id), isNull(parts.deletedAt)));
  if (existing.length === 0) return { ok: false, error: "Part tidak ditemukan" };

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(parts)
        .set({ deletedAt: new Date(), updatedBy: session.user.id })
        .where(eq(parts.id, id));
      await logActivity(tx, session.user.id, "DELETE", id, {
        before: { partCode: existing[0].partCode, partName: existing[0].partName },
      });
    });
    revalidatePath("/parts");
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Gagal menghapus part" };
  }
}

/** Look up the display name for a user id (detail-sheet metadata). */
export async function getUserName(userId: string | null): Promise<string> {
  if (!userId) return "—";
  const rows = await db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId));
  return rows[0]?.fullName ?? "—";
}
