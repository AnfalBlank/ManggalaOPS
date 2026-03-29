"use client";

import { useState } from "react";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { TopbarProfileSettingsDialog } from "@/components/layout/topbar-profile-settings-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  finance: "Finance",
  sales: "Sales",
  project_manager: "Project Manager",
};

export function ProfileMenu({ user }: { user?: { name: string; email: string; role: string; avatarUrl?: string | null } }) {
  const router = useRouter();
  const [openSettings, setOpenSettings] = useState(false);
  const initials = user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "AD";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<button type="button" className="inline-flex items-center justify-center rounded-full"><Avatar className="size-8 cursor-pointer border border-border"><AvatarImage src={user?.avatarUrl || ""} /><AvatarFallback>{initials}</AvatarFallback></Avatar></button>} />
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">{user?.name ?? "User"}</span>
                <span className="text-xs text-muted-foreground">{user?.email ?? "-"}</span>
                <span className="text-xs text-primary mt-1">{roleLabels[user?.role ?? "admin"] ?? user?.role}</span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenSettings(true)} title="Profile Settings"><UserRound className="size-4 mr-2" /> Profile Settings</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenSettings(true)} title="Account Preferences"><Settings className="size-4 mr-2" /> Account Preferences</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            toast.success('Berhasil logout');
            router.push('/login');
            router.refresh();
          }} title="Logout"><LogOut className="size-4 mr-2" /> Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TopbarProfileSettingsDialog open={openSettings} onOpenChange={setOpenSettings} user={user} />
    </>
  );
}
