import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import type { AppRole } from "@/lib/auth";
import { canAccessPath } from "@/lib/role-access";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/health",
  "/_next",
  "/favicon.ico",
  "/manggala-logo.png",
];

// A cookie alone is not proof of login: look the session up, check expiry, and read the role.
async function getSessionRole(sessionId: string | undefined): Promise<AppRole | null> {
  if (!sessionId) return null;
  try {
    const [row] = await db
      .select({ expiresAt: sessions.expiresAt, role: users.role })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId))
      .limit(1);
    if (!row) return null;
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) return null;
    return row.role as AppRole;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`) || pathname.startsWith(path));
  const sessionId = request.cookies.get("manggala_session")?.value;
  const role = await getSessionRole(sessionId);
  const hasSession = Boolean(role);
  const isApi = pathname.startsWith("/api/");

  if (!hasSession && !isPublic) {
    let response: NextResponse;
    if (isApi) {
      response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      response = NextResponse.redirect(url);
    }
    if (sessionId) response.cookies.delete("manggala_session");
    return response;
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Pages a role may not open go back to the dashboard (APIs check roles themselves via requireRole).
  if (role && !isApi && !isPublic && !canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Add basic security headers globally.
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};
