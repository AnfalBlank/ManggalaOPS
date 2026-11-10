import type { AppRole as SessionRole } from "@/lib/session-auth";
import { getCurrentUser } from "@/lib/session-auth";

export type AppRole = SessionRole;

export const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  finance: "Keuangan",
  sales: "Sales",
  project_manager: "Manajer proyek",
};

export const allRoles: AppRole[] = ["admin", "finance", "sales", "project_manager"];

export class UnauthorizedError extends Error {
  constructor(message = "Belum login") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Gak punya akses") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Returns the current role, or `null` when there is no logged-in user.
 * Callers MUST handle the null case rather than relying on a fallback role.
 */
export async function getCurrentRole(): Promise<AppRole | null> {
  const user = await getCurrentUser();
  return user ? (user.role as AppRole) : null;
}

export async function requireRole(allowed: AppRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError("Anda belum login");
  }
  const role = user.role as AppRole;
  if (!allowed.includes(role)) {
    throw new ForbiddenError(`Jabatan ${roleLabels[role] ?? role} gak punya akses ke sini`);
  }
  return { user, role };
}
