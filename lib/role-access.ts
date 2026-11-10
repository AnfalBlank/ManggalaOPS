import type { AppRole } from "@/lib/auth";

/**
 * Single source of truth for which roles can access which top-level path.
 * Used both by the sidebar (UI), the page-level RoleGuard, and middleware proxy.
 */
export const roleAccessMap: Record<AppRole, string[]> = {
  admin: [
    "/",
    "/clients",
    "/leads",
    "/projects",
    "/quotations",
    "/po",
    "/invoices",
    "/delivery-orders",
    "/payments",
    "/finance",
    "/accounting",
    "/reports",
    "/users",
    "/settings",
    "/calculator",
    "/notifications",
    "/audit-log",
  ],
  finance: [
    "/",
    "/clients",
    "/invoices",
    "/po",
    "/delivery-orders",
    "/payments",
    "/finance",
    "/accounting",
    "/reports",
    "/calculator",
    "/notifications",
  ],
  sales: [
    "/",
    "/clients",
    "/leads",
    "/projects",
    "/quotations",
    "/po",
    "/delivery-orders",
    "/calculator",
    "/notifications",
  ],
  project_manager: [
    "/",
    "/clients",
    "/projects",
    "/po",
    "/delivery-orders",
    "/reports",
    "/calculator",
    "/notifications",
  ],
};

export function canAccessPath(role: AppRole | null | undefined, path: string) {
  if (!role) return false;
  const allowed = roleAccessMap[role];
  if (!allowed) return false;
  // Match on top-level segment so /invoices/123 is still authorized via /invoices.
  return allowed.some((entry) => entry === path || (entry !== "/" && path.startsWith(`${entry}/`)) || (entry === "/" && path === "/"));
}
