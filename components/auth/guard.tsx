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
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
        <div className="font-semibold mb-1">Akses dibatasi untuk role ini</div>
        <div>Role aktif <span className="font-semibold">{labels[role]}</span> tidak punya izin membuka halaman ini. Silakan gunakan akun dengan role yang sesuai.</div>
      </div>
    );
  }

  return <>{children}</>;
}
