import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { PanelPdf } from "@/components/layout/panel-pdf";
import { Topbar } from "@/components/layout/topbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/session-auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar role={user.role} user={{ name: user.name, email: user.email }} />
      <SidebarInset className="flex flex-col h-screen min-w-0">
        <Topbar user={{ name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl ?? undefined }} />
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
      <PanelPdf />
    </SidebarProvider>
  );
}
