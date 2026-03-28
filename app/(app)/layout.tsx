import { RoleSwitcher } from "@/components/auth/role-switcher";
import { AppShell } from "@/components/layout/app-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="px-4 pt-3"><RoleSwitcher /></div>
      {children}
    </AppShell>
  );
}
