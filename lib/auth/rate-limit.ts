import "server-only";
import { headers } from "next/headers";

/**
 * In-memory brute-force guard for `signIn`.
 *
 * Tracks failed attempts per (client-ip + nik) bucket. After MAX_FAILS within
 * WINDOW_MS, the bucket is blocked for BLOCK_MS. Memory only — sufficient for
 * a single-instance Next.js deployment; replace with Redis if you scale out.
 */
const WINDOW_MS = 15 * 60_000; // 15 minutes
const BLOCK_MS = 5 * 60_000; // 5 minutes
const MAX_FAILS = 5;

interface Bucket {
  /** Timestamps (ms) of fails inside the current rolling window. */
  fails: number[];
  /** When the bucket is locked, the earliest ms it may try again. */
  blockedUntil: number;
}

const buckets = new Map<string, Bucket>();

/** Best-effort client IP from common proxy headers; falls back to "anon". */
async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "anon";
}

function keyFor(ip: string, nik: string): string {
  return `${ip}::${nik.trim().toLowerCase()}`;
}

function prune(bucket: Bucket, now: number): void {
  const cutoff = now - WINDOW_MS;
  bucket.fails = bucket.fails.filter((t) => t >= cutoff);
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the bucket frees up — only set when allowed=false. */
  retryAfterSeconds?: number;
  /** Failed attempts remaining in the current window — only set when allowed=true. */
  remaining?: number;
}

/** Call before verifying credentials. Blocks the attempt if the bucket is locked. */
export async function checkLoginRate(nik: string): Promise<RateLimitResult> {
  const ip = await clientIp();
  const key = keyFor(ip, nik);
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket) return { allowed: true, remaining: MAX_FAILS };

  if (bucket.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }
  prune(bucket, now);
  return { allowed: true, remaining: Math.max(0, MAX_FAILS - bucket.fails.length) };
}

/** Call after a verified-bad credential attempt. Trips the block at MAX_FAILS. */
export async function recordLoginFail(nik: string): Promise<void> {
  const ip = await clientIp();
  const key = keyFor(ip, nik);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { fails: [], blockedUntil: 0 };
  prune(bucket, now);
  bucket.fails.push(now);
  if (bucket.fails.length >= MAX_FAILS) {
    bucket.blockedUntil = now + BLOCK_MS;
    bucket.fails = []; // reset counter; the block itself is the punishment
  }
  buckets.set(key, bucket);
}

/** Call after a successful login. Clears any pending fails for the bucket. */
export async function clearLoginFails(nik: string): Promise<void> {
  const ip = await clientIp();
  buckets.delete(keyFor(ip, nik));
}
