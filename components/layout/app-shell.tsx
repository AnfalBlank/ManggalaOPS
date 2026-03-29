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
    <SidebarProvider defaultOpen={true} className="block">
      <div className="relative h-screen w-full overflow-hidden bg-background">
        <AppSidebar role={user.role} user={{ name: user.name, email: user.email }} />
        <div className="flex h-screen w-full md:pl-72">
          <main className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
            <Topbar user={{ name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl ?? undefined }} />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
