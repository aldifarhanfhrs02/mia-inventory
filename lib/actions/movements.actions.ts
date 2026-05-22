"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  activityLogs,
  parts,
  projects,
  stockMovements,
  users,
} from "@/lib/db/schema";
import { getServerSession, isAdmin } from "@/lib/auth/session";
import { CreateMovementSchema } from "@/lib/validations/movements.schema";
import type {
  ActionResult,
  CreateMovementInput,
  MovementType,
  PartType,
} from "@/lib/types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface MovementRow {
  id: string;
  type: MovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  requestor: string;
  project: string | null;
  createdAt: Date;
  partId: string;
  partName: string;
  partCode: string;
  maker: string;
  partType: PartType;
  unit: string;
  inputerName: string;
}

interface GetMovementsParams {
  search?: string;
  type?: string;
  partType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}

const PAGE_SIZE = 15;

/** Compute a part's current stock from its movements (within a txn). */
async function currentStock(tx: Tx, partId: string): Promise<number> {
  const [row] = await tx
    .select({
      total: sql<number>`
        COALESCE(SUM(CASE WHEN ${stockMovements.type} IN ('INITIAL','IN')
          THEN ${stockMovements.quantity} ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN ${stockMovements.type} = 'OUT'
          THEN ${stockMovements.quantity} ELSE 0 END), 0)`,
    })
    .from(stockMovements)
    .where(eq(stockMovements.partId, partId));
  return Number(row?.total ?? 0);
}

/** Filtered, paginated movement list with IN/OUT summary. */
export async function getMovements(params: GetMovementsParams): Promise<{
  rows: MovementRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: { countIn: number; countOut: number; qtyIn: number; qtyOut: number };
}> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const raw = await db
    .select({
      id: stockMovements.id,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      stockBefore: stockMovements.stockBefore,
      stockAfter: stockMovements.stockAfter,
      requestor: stockMovements.requestor,
      project: stockMovements.project,
      createdAt: stockMovements.createdAt,
      partId: stockMovements.partId,
      partName: parts.partName,
      partCode: parts.partCode,
      maker: parts.maker,
      partType: parts.type,
      unit: parts.unit,
      inputerName: users.fullName,
    })
    .from(stockMovements)
    .innerJoin(parts, eq(parts.id, stockMovements.partId))
    .leftJoin(users, eq(users.nik, stockMovements.inputerNik))
    .orderBy(desc(stockMovements.createdAt));

  let rows: MovementRow[] = raw.map((r) => ({
    ...r,
    inputerName: r.inputerName ?? "—",
  }));

  const {
    search = "",
    type = "all",
    partType = "all",
    dateFrom = "",
    dateTo = "",
    page = 1,
  } = params;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter((m) =>
      [m.partName, m.partCode, m.requestor, m.project ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  if (type !== "all") rows = rows.filter((m) => m.type === type);
  if (partType !== "all") rows = rows.filter((m) => m.partType === partType);
  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    rows = rows.filter((m) => new Date(m.createdAt) >= from);
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    rows = rows.filter((m) => new Date(m.createdAt) <= to);
  }

  const summary = {
    countIn: rows.filter((m) => m.type !== "OUT").length,
    countOut: rows.filter((m) => m.type === "OUT").length,
    qtyIn: rows
      .filter((m) => m.type !== "OUT")
      .reduce((s, m) => s + m.quantity, 0),
    qtyOut: rows
      .filter((m) => m.type === "OUT")
      .reduce((s, m) => s + m.quantity, 0),
  };

  const total = rows.length;
  const start = (page - 1) * PAGE_SIZE;
  return {
    rows: rows.slice(start, start + PAGE_SIZE),
    total,
    page,
    pageSize: PAGE_SIZE,
    summary,
  };
}

/** Resolve an active part by barcode (numeric) or part code; with stock. */
export async function getPartByIdentifier(identifier: string): Promise<{
  id: string;
  partName: string;
  partCode: string;
  maker: string;
  unit: string;
  currentStock: number;
} | null> {
  const session = await getServerSession();
  if (!session) return null;

  const key = identifier.trim();
  if (!key) return null;
  const isNumeric = /^\d+$/.test(key);

  const found = await db
    .select()
    .from(parts)
    .where(
      and(
        eq(parts.status, "active"),
        isNull(parts.deletedAt),
        isNumeric
          ? eq(parts.barcode, key)
          : sql`LOWER(${parts.partCode}) = ${key.toLowerCase()}`,
      ),
    );
  const part = found[0];
  if (!part) return null;

  const stock = await db.transaction((tx) => currentStock(tx, part.id));
  return {
    id: part.id,
    partName: part.partName,
    partCode: part.partCode,
    maker: part.maker,
    unit: part.unit,
    currentStock: stock,
  };
}

/** Resolve a requestor's full name from their NIK. */
export async function lookupRequestor(
  nik: string,
): Promise<{ nik: string; name: string } | null> {
  const key = nik.trim();
  if (!key) return null;
  const found = await db
    .select({ nik: users.nik, name: users.fullName })
    .from(users)
    .where(sql`LOWER(${users.nik}) = ${key.toLowerCase()}`);
  return found[0] ?? null;
}

/** Project names for the CreatableSelect. */
export async function getProjects(): Promise<string[]> {
  const rows = await db
    .select({ name: projects.name })
    .from(projects)
    .orderBy(projects.name);
  return rows.map((r) => r.name);
}

/** Record an immutable Stock IN / OUT transaction. Admin only. */
export async function createMovement(
  input: CreateMovementInput,
): Promise<ActionResult<{ stockAfter: number }>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const parsed = CreateMovementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const v = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const key = v.partIdentifier.trim();
      const isNumeric = /^\d+$/.test(key);
      const [part] = await tx
        .select()
        .from(parts)
        .where(
          and(
            eq(parts.status, "active"),
            isNull(parts.deletedAt),
            isNumeric
              ? eq(parts.barcode, key)
              : sql`LOWER(${parts.partCode}) = ${key.toLowerCase()}`,
          ),
        );
      if (!part) throw new Error("Part tidak ditemukan atau tidak aktif");

      const before = await currentStock(tx, part.id);
      if (v.type === "OUT" && v.quantity > before) {
        throw new Error(
          `Quantity melebihi stok tersedia (${before} ${part.unit})`,
        );
      }
      const after =
        v.type === "IN" ? before + v.quantity : before - v.quantity;

      // If the project is new, persist it for future CreatableSelect use.
      if (v.project?.trim()) {
        await tx
          .insert(projects)
          .values({ name: v.project.trim() })
          .onConflictDoNothing();
      }

      const [movement] = await tx
        .insert(stockMovements)
        .values({
          partId: part.id,
          type: v.type,
          quantity: v.quantity,
          stockBefore: before,
          stockAfter: after,
          requestor: v.requestor,
          inputerNik: session.user.nik,
          project: v.project?.trim() || null,
        })
        .returning({ id: stockMovements.id });

      await tx.insert(activityLogs).values({
        userId: session.user.id,
        action: v.type === "IN" ? "STOCK_IN" : "STOCK_OUT",
        entityType: "Movement",
        entityId: movement.id,
        changes: {
          partCode: part.partCode,
          type: v.type,
          quantity: v.quantity,
          stockBefore: before,
          stockAfter: after,
        },
      });

      return after;
    });

    revalidatePath("/movements");
    revalidatePath("/parts");
    revalidatePath("/dashboard");
    return { ok: true, data: { stockAfter: result } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan transaksi",
    };
  }
}
