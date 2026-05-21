import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LEN = 64;

/**
 * Hash a password with scrypt. Output format: "<salt-hex>:<derived-hex>".
 * Used by the seed script and by the Better Auth credential flow (Phase 3).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

/** Constant-time verification of a password against a stored scrypt hash. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  const keyBuf = Buffer.from(key, "hex");
  return keyBuf.length === derived.length && timingSafeEqual(keyBuf, derived);
}
