"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type NotificationItem = { id: number; title: string; message?: string | null; type?: string | null; isRead?: boolean | null; createdAt?: string | null };

export function NotificationsMenu() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = async () => {
    const response = await fetch('/api/notifications');
    const payload = await response.json();
    if (response.ok) setItems(payload);
  };

  useEffect(() => { load(); }, []);

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" className="text-muted-foreground hover:text-foreground transition-colors relative inline-flex"><Bell className="size-5" />{unreadCount > 0 ? <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">{unreadCount}</span> : null}</button>} />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {items.length === 0 ? <DropdownMenuItem>No notifications</DropdownMenuItem> : items.map((item) => <DropdownMenuItem key={item.id} className="flex-col items-start"><span className="font-medium">{item.title}</span><span className="text-xs text-muted-foreground">{item.message ?? '-'}</span></DropdownMenuItem>)}
        {items.length > 0 ? <><DropdownMenuSeparator /><DropdownMenuItem onClick={async () => { await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark-all-read' }) }); await load(); }}>Mark all as read</DropdownMenuItem></> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
