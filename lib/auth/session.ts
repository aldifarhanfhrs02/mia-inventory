import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { UserRole } from "@/lib/types";

export const SESSION_COOKIE = "mia_session";
const MAX_AGE_SECONDS = 8 * 60 * 60; // 8-hour idle timeout (PRD AR-06)

/** The authenticated user as exposed to server components and actions. */
export interface SessionUser {
  id: string;
  nik: string;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
}

export interface Session {
  user: SessionUser;
}

function secret(): string {
  return process.env.BETTER_AUTH_SECRET ?? "mia-dev-secret-change-me";
}

/** Sign a payload string with HMAC-SHA256 → "<payload>.<sig>". */
export function signToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + MAX_AGE_SECONDS * 1000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function readToken(token: string): { userId: string; exp: number } | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.userId !== "string" || typeof data.exp !== "number")
      return null;
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;

/** Resolve the current session from the signed cookie, or null. */
export async function getServerSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const data = readToken(token);
  if (!data) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, data.userId));
  if (!user || user.status !== "active") return null;

  return {
    user: {
      id: user.id,
      nik: user.nik,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

/** True when the session user may perform admin-only mutations. */
export function isAdmin(session: Session | null): boolean {
  return session?.user.role === "admin" || session?.user.role === "superadmin";
}
