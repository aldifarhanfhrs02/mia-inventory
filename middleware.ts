import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mia_session";

/**
 * Lightweight auth gate. Presence of the session cookie is checked here;
 * full HMAC + DB verification happens in getServerSession() on the page.
 * The forced change-password redirect is handled by the dashboard layout.
 */
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const path = req.nextUrl.pathname;
  const isLogin = path === "/login";

  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (hasSession && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Run on every route except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
