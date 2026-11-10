"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { isiNotifikasi, judulNotifikasi } from "@/lib/label-status";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type NotificationItem = { id: number; title: string; message?: string | null; type?: string | null; isRead?: boolean | null; createdAt?: string | null };

export function NotificationsMenu() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = async () => {
    const response = await fetch('/api/notifications');
    const payload = await response.json().catch(() => null);
    if (response.ok && Array.isArray(payload)) setItems(payload);
  };

  useEffect(() => { load(); }, []);

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" className="text-muted-foreground hover:text-foreground transition-colors relative inline-flex items-center justify-center size-10 md:size-auto"><Bell className="size-5" />{unreadCount > 0 ? <span className="absolute top-1 right-1 md:-top-1 md:-right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">{unreadCount}</span> : null}</button>} />
      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-1rem))]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifikasi {unreadCount > 0 ? <span className="ml-1 text-xs text-muted-foreground">({unreadCount} baru)</span> : null}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <DropdownMenuItem disabled>Belum ada notifikasi</DropdownMenuItem>
          ) : items.slice(0, 8).map((item) => (
            <DropdownMenuItem key={item.id} className="flex-col items-start gap-0.5">
              <span className={`text-sm ${item.isRead ? "" : "font-semibold"}`}>{judulNotifikasi(item.title)}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{isiNotifikasi(item.message)}</span>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/notifications" />}>
          Lihat semua notifikasi
        </DropdownMenuItem>
        {items.length > 0 && unreadCount > 0 ? (
          <DropdownMenuItem onClick={async () => { await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark-all-read' }) }); await load(); }}>
            Tandai semua sudah dibaca
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
