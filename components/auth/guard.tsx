import { ReactNode } from "react";

import { getCurrentRole, type AppRole } from "@/lib/auth";

const labels: Record<AppRole, string> = {
  admin: "Admin",
  finance: "Finance",
  sales: "Sales",
  project_manager: "Project Manager",
};

export async function RoleGuard({
  allow,
  children,
}: {
  allow: AppRole[];
  children: ReactNode;
}) {
  const role = await getCurrentRole();

  if (!allow.includes(role)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Role aktif <span className="font-semibold">{labels[role]}</span> tidak punya akses ke halaman ini.
      </div>
    );
  }

  return <>{children}</>;
}
