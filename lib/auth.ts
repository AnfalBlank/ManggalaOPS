import type { AppRole as SessionRole } from "@/lib/session-auth";
import { getCurrentUser } from "@/lib/session-auth";

export type AppRole = SessionRole;

export const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  finance: "Finance",
  sales: "Sales",
  project_manager: "Project Manager",
};

export async function getCurrentRole(): Promise<AppRole> {
  const user = await getCurrentUser();
  return (user?.role as AppRole | undefined) ?? "sales";
}

export async function requireRole(allowed: AppRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const role = user.role as AppRole;
  if (!allowed.includes(role)) {
    throw new Error(`Akses ditolak untuk role ${roleLabels[role]}`);
  }
  return role;
}
