"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Input } from "@/components/ui/input";

export function Topbar({ user }: { user?: { name: string; email: string; role: string } }) {
  return (
    <header className="sticky top-0 z-10 w-full flex items-center h-16 px-4 border-b bg-white shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:bg-muted" />
        <div className="w-1 h-4 bg-border mx-2 hidden sm:block"></div>
        <div className="hidden sm:flex items-center text-sm text-muted-foreground font-medium w-64">
          <Search className="size-4 mr-2" />
          <Input 
            placeholder="Search CRM, projects..." 
            className="border-none shadow-none focus-visible:ring-0 h-8 px-0 text-sm placeholder:text-muted-foreground/70"
          />
        </div>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        {user ? <div className="hidden md:block text-right"><div className="text-sm font-semibold">{user.name}</div><div className="text-xs text-muted-foreground">{user.role}</div></div> : null}
        <button className="text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell className="size-5" />
          <span className="absolute top-0 right-0 size-2 bg-destructive rounded-full" />
        </button>
        <LogoutButton />
        <Avatar className="size-8 cursor-pointer border border-border">
          <AvatarImage src="https://ui.shadcn.com/avatars/04.png" />
          <AvatarFallback>{user?.name?.slice(0,2).toUpperCase() ?? "AD"}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
