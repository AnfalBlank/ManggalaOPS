import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/session-auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar role={user.role} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar user={{ name: user.name, email: user.email, role: user.role }} />
        {children}
      </main>
    </SidebarProvider>
  );
}
