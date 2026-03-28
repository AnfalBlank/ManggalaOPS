import { cookies } from "next/headers";

export type AppRole = "admin" | "finance" | "sales" | "project_manager";

export const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  finance: "Finance",
  sales: "Sales",
  project_manager: "Project Manager",
};

export async function getCurrentRole(): Promise<AppRole> {
  const cookieStore = await cookies();
  const role = cookieStore.get("manggala_role")?.value as AppRole | undefined;
  return role && role in roleLabels ? role : "admin";
}

export async function requireRole(allowed: AppRole[]) {
  const role = await getCurrentRole();
  if (!allowed.includes(role)) {
    throw new Error(`Akses ditolak untuk role ${roleLabels[role]}`);
  }
  return role;
}
