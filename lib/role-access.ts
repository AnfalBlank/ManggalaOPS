import type { AppRole } from "@/lib/auth";

/**
 * Single source of truth for which roles can access which top-level path.
 * Used both by the sidebar (UI), the page-level RoleGuard, and middleware proxy.
 */
export const roleAccessMap: Record<AppRole, string[]> = {
  admin: [
    "/",
    "/chat",
    "/clients",
    "/leads",
    "/projects",
    "/quotations",
    "/invoices",
    "/delivery-orders",
    "/payments",
    "/finance",
    "/accounting",
    "/reports",
    "/users",
    "/settings",
    "/calculator",
  ],
  finance: [
    "/",
    "/chat",
    "/clients",
    "/invoices",
    "/delivery-orders",
    "/payments",
    "/finance",
    "/accounting",
    "/reports",
    "/calculator",
  ],
  sales: [
    "/",
    "/chat",
    "/clients",
    "/leads",
    "/projects",
    "/quotations",
    "/invoices",
    "/delivery-orders",
    "/reports",
    "/calculator",
  ],
  project_manager: [
    "/",
    "/chat",
    "/clients",
    "/projects",
    "/delivery-orders",
    "/reports",
    "/calculator",
  ],
};

export function canAccessPath(role: AppRole | null | undefined, path: string) {
  if (!role) return false;
  const allowed = roleAccessMap[role];
  if (!allowed) return false;
  // Match on top-level segment so /invoices/123 is still authorized via /invoices.
  return allowed.some((entry) => entry === path || (entry !== "/" && path.startsWith(`${entry}/`)) || (entry === "/" && path === "/"));
}
