import { Settings2, ShieldCheck, UserCog } from "lucide-react";

import { RoleGuard } from "@/components/auth/guard";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <PageWrapper>
      <RoleGuard allow={["admin"]}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Settings</h1>
          <p className="text-muted-foreground mt-1">Pengaturan sistem dasar untuk ManggalaOPS.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings2 className="size-5 text-primary" /> General</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Workspace sudah memakai Next.js + Drizzle + Turso. Pengaturan teknis lanjutan bisa diteruskan dari halaman ini nanti.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCog className="size-5 text-primary" /> User & Roles</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              User management sudah tersedia di menu Users. Role aktif akan memengaruhi akses menu dan halaman.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Security</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Login, logout, session, dan route protection dasar sudah aktif. Next step bisa tambah audit log dan policy yang lebih ketat.
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    </PageWrapper>
  );
}
