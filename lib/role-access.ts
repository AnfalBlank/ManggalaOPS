import type { AppRole } from "@/lib/auth";

export const roleAccessMap: Record<AppRole, string[]> = {
  admin: ["/", "/chat", "/clients", "/leads", "/projects", "/quotations", "/invoices", "/payments", "/finance", "/accounting", "/reports", "/users", "/settings"],
  finance: ["/", "/chat", "/clients", "/invoices", "/payments", "/finance", "/accounting", "/reports"],
  sales: ["/", "/chat", "/clients", "/leads", "/projects", "/quotations", "/invoices", "/reports"],
  project_manager: ["/", "/chat", "/clients", "/projects", "/reports"],
};

export function canAccessPath(role: AppRole, path: string) {
  return roleAccessMap[role].includes(path);
}
