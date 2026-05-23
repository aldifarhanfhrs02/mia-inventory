import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mia_session";

/**
 * Auth gate (Next 16 "proxy" — formerly middleware).
 *
 * Only a fast cookie-presence check runs here; the cookie's real validity is
 * verified by getServerSession() in the dashboard layout. There is deliberately
 * NO "has cookie + on /login → /dashboard" rule: a present-but-invalid cookie
 * (e.g. after a DB reseed) would bounce /login → /dashboard → /login forever.
 */
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const path = req.nextUrl.pathname;

  if (!hasSession && path !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Run on every route except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
