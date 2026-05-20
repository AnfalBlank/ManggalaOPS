import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentRole, roleLabels, type AppRole } from "@/lib/auth";

export async function RoleGuard({
  allow,
  children,
}: {
  allow: AppRole[];
  children: ReactNode;
}) {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/login");
  }

  if (!allow.includes(role)) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
        <div className="font-semibold mb-1">Akses dibatasi untuk role ini</div>
        <div>
          Role aktif <span className="font-semibold">{roleLabels[role]}</span> tidak punya izin
          membuka halaman ini. Silakan gunakan akun dengan role yang sesuai.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
