"use server";

import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { activityLogs, users } from "@/lib/db/schema";
import { getServerSession, isAdmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import {
  CreateUserSchema,
  UpdateUserSchema,
} from "@/lib/validations/users.schema";
import type {
  ActionResult,
  ActivityAction,
  CreateUserInput,
  UserRole,
} from "@/lib/types";

export interface UserListRow {
  id: string;
  nik: string;
  fullName: string;
  role: UserRole;
  status: "active" | "inactive";
  lastLoginAt: Date | null;
  createdAt: Date;
}

/** Temp password: "Epson@" + 4 unambiguous chars (PRD AR-02). */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(4);
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[bytes[i] % chars.length];
  return `Epson@${out}`;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function logUser(
  tx: Tx,
  userId: string,
  action: ActivityAction,
  entityId: string,
  changes: Record<string, unknown>,
) {
  await tx.insert(activityLogs).values({
    userId,
    action,
    entityType: "User",
    entityId,
    changes,
  });
}

/** All users + summary counts. */
export async function getUsers(): Promise<{
  rows: UserListRow[];
  summary: { total: number; active: number; admin: number; inactive: number };
}> {
  const session = await getServerSession();
  if (!session || !isAdmin(session)) throw new Error("Forbidden");

  const rows = await db
    .select({
      id: users.id,
      nik: users.nik,
      fullName: users.fullName,
      role: users.role,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);

  return {
    rows,
    summary: {
      total: rows.length,
      active: rows.filter((u) => u.status === "active").length,
      admin: rows.filter(
        (u) => u.role === "admin" || u.role === "superadmin",
      ).length,
      inactive: rows.filter((u) => u.status === "inactive").length,
    },
  };
}

/** Create a user with a one-time temp password. Admin only. */
export async function createUser(
  input: CreateUserInput,
): Promise<ActionResult<{ tempPassword: string }>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const parsed = CreateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const v = parsed.data;

  const dup = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`LOWER(${users.nik}) = ${v.nik.trim().toLowerCase()}`);
  if (dup.length > 0) return { ok: false, error: "Employee ID is already registered" };

  const tempPassword = generateTempPassword();
  // Hash before opening the transaction — bcrypt would otherwise hold the
  // row/table lock open for the full ~100-300ms of CPU work.
  const passwordHash = await hashPassword(tempPassword);
  try {
    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          nik: v.nik.trim(),
          fullName: v.fullName.trim(),
          passwordHash,
          role: v.role,
          status: "active",
          mustChangePassword: true,
        })
        .returning({ id: users.id });
      await logUser(tx, session.user.id, "CREATE_USER", created.id, {
        after: { nik: v.nik, fullName: v.fullName, role: v.role },
      });
    });
    revalidatePath("/users");
    return { ok: true, data: { tempPassword } };
  } catch {
    return { ok: false, error: "Failed to create user" };
  }
}

/** Reset a user's password, returning a new one-time temp password. */
export async function resetPassword(
  id: string,
): Promise<ActionResult<{ tempPassword: string }>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) return { ok: false, error: "User not found" };

  const tempPassword = generateTempPassword();
  // Hash before opening the transaction (see createUser for rationale).
  const passwordHash = await hashPassword(tempPassword);
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
    await logUser(tx, session.user.id, "RESET_PASSWORD", id, {
      before: { nik: user.nik },
    });
  });
  revalidatePath("/users");
  return { ok: true, data: { tempPassword } };
}

/** Activate / deactivate a user — guards the last active admin. */
export async function setUserActive(
  id: string,
  active: boolean,
): Promise<ActionResult<null>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) return { ok: false, error: "User not found" };

  if (!active && (user.role === "admin" || user.role === "superadmin")) {
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(
        and(
          eq(users.status, "active"),
          sql`${users.role} IN ('admin','superadmin')`,
        ),
      );
    if (Number(count) <= 1) {
      return {
        ok: false,
        error: "Promote another admin before deactivating the last one.",
      };
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ status: active ? "active" : "inactive", updatedAt: new Date() })
      .where(eq(users.id, id));
    await logUser(
      tx,
      session.user.id,
      active ? "REACTIVATE" : "DEACTIVATE_USER",
      id,
      { before: { nik: user.nik, status: user.status } },
    );
  });
  revalidatePath("/users");
  return { ok: true, data: null };
}

/** Update a user's editable profile fields (fullName only). Admin only. */
export async function updateUser(
  id: string,
  input: { fullName: string },
): Promise<ActionResult<null>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const parsed = UpdateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) return { ok: false, error: "User not found" };

  const next = parsed.data.fullName.trim();
  if (next === user.fullName) return { ok: true, data: null };

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ fullName: next, updatedAt: new Date() })
      .where(eq(users.id, id));
    await logUser(tx, session.user.id, "UPDATE_USER", id, {
      before: { fullName: user.fullName },
      after: { fullName: next },
    });
  });
  revalidatePath("/users");
  revalidatePath("/account");
  return { ok: true, data: null };
}

/** Change a user's role. Admin only. */
export async function updateUserRole(
  id: string,
  role: "admin" | "user",
): Promise<ActionResult<null>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) return { ok: false, error: "User not found" };

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id));
    await logUser(tx, session.user.id, "CHANGE_ROLE", id, {
      before: { role: user.role },
      after: { role },
    });
  });
  revalidatePath("/users");
  return { ok: true, data: null };
}
