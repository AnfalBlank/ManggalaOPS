"use client";

import { useState } from "react";
import { Bell, LogOut, UserRound } from "lucide-react";
import Link from "next/link";

import { LABEL_JABATAN } from "@/lib/label-status";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { TopbarProfileSettingsDialog } from "@/components/layout/topbar-profile-settings-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const roleLabels = LABEL_JABATAN;

export function ProfileMenu({ user }: { user?: { name: string; email: string; role: string; avatarUrl?: string | null } }) {
  const router = useRouter();
  const [openSettings, setOpenSettings] = useState(false);
  const initials = user?.name?.replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "AD";
  const avatarSrc = user?.avatarUrl ? user.avatarUrl.replace(/^\/uploads\//, "/api/uploads/") : "";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<button type="button" className="inline-flex items-center justify-center rounded-full size-10 md:size-auto"><Avatar className="size-8 cursor-pointer border border-border"><AvatarImage src={avatarSrc} /><AvatarFallback>{initials}</AvatarFallback></Avatar></button>} />
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">{user?.name ?? "Pengguna"}</span>
                <span className="text-xs text-muted-foreground">{user?.email ?? "-"}</span>
                <span className="text-xs text-primary mt-1">{roleLabels[user?.role ?? "admin"] ?? user?.role}</span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenSettings(true)}><UserRound className="size-4 mr-2" /> Profil saya</DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/notifications" />}><Bell className="size-4 mr-2" /> Notifikasi</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            toast.success('Kamu udah keluar');
            router.push('/login');
            router.refresh();
          }}><LogOut className="size-4 mr-2" /> Keluar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TopbarProfileSettingsDialog open={openSettings} onOpenChange={setOpenSettings} user={user} />
    </>
  );
}
