"use server";

import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getServerSession, SESSION_COOKIE, SESSION_MAX_AGE, signToken } from "./session";
import { hashPassword, verifyPassword } from "./password";
import { ChangePasswordSchema, LoginSchema } from "@/lib/validations/users.schema";
import type { ActionResult, ChangePasswordInput, LoginInput } from "@/lib/types";

/** Authenticate by NIK + password and start a session. */
export async function signIn(
  input: LoginInput,
): Promise<ActionResult<{ mustChangePassword: boolean }>> {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "NIK atau password salah" };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.nik}) = ${parsed.data.nik.trim().toLowerCase()}`);

  // Generic error — never reveal which field was wrong (PRD AR-10).
  if (!user || user.status !== "active") {
    return { ok: false, error: "NIK atau password salah" };
  }
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "NIK atau password salah" };
  }

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
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));
  if (!user) return { ok: false, error: "User tidak ditemukan" };

  // Old password is required unless this is a forced first-login change.
  if (!user.mustChangePassword) {
    if (!parsed.data.oldPassword) {
      return { ok: false, error: "Password lama wajib diisi" };
    }
    const ok = await verifyPassword(parsed.data.oldPassword, user.passwordHash);
    if (!ok) return { ok: false, error: "Password lama salah" };
  }

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.newPassword),
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return { ok: true, data: null };
}
