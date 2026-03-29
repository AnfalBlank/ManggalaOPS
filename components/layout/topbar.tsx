"use client";

import { Menu, Search } from "lucide-react";

import { ChatMenu } from "@/components/layout/chat-menu";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { Input } from "@/components/ui/input";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  finance: "Finance",
  sales: "Sales",
  project_manager: "Project Manager",
};

export function Topbar({ user }: { user?: { name: string; email: string; role: string; avatarUrl?: string } }) {

  return (
    <header className="sticky top-0 z-30 w-full flex items-center h-16 px-4 md:px-6 border-b bg-white/95 backdrop-blur shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button type="button" className="inline-flex md:hidden items-center justify-center rounded-md border p-2 text-muted-foreground">
          <Menu className="size-4" />
        </button>
        <div className="w-1 h-4 bg-border mx-2 hidden sm:block"></div>
        <div className="hidden lg:flex items-center text-sm text-muted-foreground font-medium w-64 min-w-0">
          <Search className="size-4 mr-2" />
          <Input
            placeholder="Search CRM, projects..."
            className="border-none shadow-none focus-visible:ring-0 h-8 px-0 text-sm placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3 md:gap-4">
        {user ? (
          <div className="hidden md:block text-right">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-muted-foreground">{roleLabels[user.role] ?? user.role}</div>
          </div>
        ) : null}

        <ChatMenu />

        <NotificationsMenu />

        <ProfileMenu user={user} />
      </div>
    </header>
  );
}
