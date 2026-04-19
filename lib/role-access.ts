import type { AppRole } from "@/lib/auth";

export const roleAccessMap: Record<AppRole, string[]> = {
  admin: ["/", "/chat", "/attendance", "/clients", "/leads", "/projects", "/quotations", "/invoices", "/payments", "/finance", "/accounting", "/reports", "/users", "/settings", "/calculator"],
  finance: ["/", "/chat", "/attendance", "/clients", "/invoices", "/payments", "/finance", "/accounting", "/reports", "/calculator"],
  sales: ["/", "/chat", "/attendance", "/clients", "/leads", "/projects", "/quotations", "/invoices", "/reports", "/calculator"],
  project_manager: ["/", "/chat", "/attendance", "/clients", "/projects", "/reports", "/calculator"],
};

export function canAccessPath(role: AppRole, path: string) {
  return roleAccessMap[role].includes(path);
}
