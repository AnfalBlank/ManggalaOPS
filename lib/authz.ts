import type { AppRole } from "@/lib/auth";

export const routeAccess: Record<string, AppRole[]> = {
  "/": ["admin", "finance", "sales", "project_manager"],
  "/leads": ["admin", "sales"],
  "/projects": ["admin", "project_manager", "sales"],
  "/quotations": ["admin", "sales"],
  "/invoices": ["admin", "finance", "sales"],
  "/payments": ["admin", "finance"],
  "/finance": ["admin", "finance"],
  "/accounting": ["admin", "finance"],
  "/reports": ["admin", "finance", "sales", "project_manager"],
  "/users": ["admin"],
};

export function canAccessPath(role: AppRole, pathname: string) {
  const direct = routeAccess[pathname];
  if (direct) return direct.includes(role);

  const matched = Object.entries(routeAccess).find(([path]) => pathname.startsWith(path) && path !== "/");
  if (matched) return matched[1].includes(role);

  return true;
}
