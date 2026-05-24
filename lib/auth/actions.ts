"use server";

import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs, users } from "@/lib/db/schema";
import { getServerSession, SESSION_COOKIE, SESSION_MAX_AGE, signToken } from "./session";
import { hashPassword, verifyPassword } from "./password";
import {
  checkLoginRate,
  clearLoginFails,
  recordLoginFail,
} from "./rate-limit";
import { ChangePasswordSchema, LoginSchema } from "@/lib/validations/users.schema";
import type { ActionResult, ChangePasswordInput, LoginInput } from "@/lib/types";

/** Authenticate by NIK + password and start a session. */
export async function signIn(
  input: LoginInput,
): Promise<ActionResult<{ mustChangePassword: boolean }>> {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Employee ID or password is incorrect" };
  }

  // Brute-force guard — check before any DB or bcrypt work.
  const rate = await checkLoginRate(parsed.data.nik);
  if (!rate.allowed) {
    const mins = Math.ceil((rate.retryAfterSeconds ?? 0) / 60);
    return {
      ok: false,
      error: `Too many login attempts. Try again in ${mins} minutes.`,
    };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.nik}) = ${parsed.data.nik.trim().toLowerCase()}`);

  // Generic error — never reveal which field was wrong (PRD AR-10).
  if (!user || user.status !== "active") {
    await recordLoginFail(parsed.data.nik);
    return { ok: false, error: "Employee ID or password is incorrect" };
  }
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    await recordLoginFail(parsed.data.nik);
    return { ok: false, error: "Employee ID or password is incorrect" };
  }

  await clearLoginFails(parsed.data.nik);

  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  (await cookies()).set(SESSION_COOKIE, signToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return { ok: true, data: { mustChangePassword: user.mustChangePassword } };
}

/** Clear the session cookie. */
export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Change the current user's password. */
export async function changePassword(
  input: ChangePasswordInput,
): Promise<ActionResult<null>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const parsed = ChangePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));
  if (!user) return { ok: false, error: "User not found" };

  // Old password is required unless this is a forced first-login change.
  if (!user.mustChangePassword) {
    if (!parsed.data.oldPassword) {
      return { ok: false, error: "Old password is required" };
    }
    const ok = await verifyPassword(parsed.data.oldPassword, user.passwordHash);
    if (!ok) return { ok: false, error: "Old password is incorrect" };
  }

  // Hash before opening the transaction — bcrypt holds the row lock otherwise.
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    await tx.insert(activityLogs).values({
      userId: session.user.id,
      action: "CHANGE_PASSWORD",
      entityType: "User",
      entityId: user.id,
      changes: { before: { nik: user.nik } },
    });
  });

  return { ok: true, data: null };
}
