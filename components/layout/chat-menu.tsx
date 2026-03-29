"use client";

import Link from "next/link";
import { MessageSquareMore, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type ChatItem = { id: number; title: string; kind: string; latestMessage: string; latestAt?: string | null };

export function ChatMenu() {
  const [items, setItems] = useState<ChatItem[]>([]);

  const load = async () => {
    const response = await fetch('/api/chat');
    const payload = await response.json();
    if (response.ok) setItems(payload);
  };

  useEffect(() => { load(); }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" className="text-muted-foreground hover:text-foreground transition-colors relative inline-flex"><MessageSquareMore className="size-5" />{items.length > 0 ? <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center">{items.length}</span> : null}</button>} />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Chat Center</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={async () => {
          const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create-broadcast', title: 'Broadcast Internal' }) });
          const payload = await response.json();
          if (!response.ok) { toast.error(payload.error ?? 'Gagal membuat broadcast'); return; }
          toast.success('Broadcast thread dibuat');
          load();
        }}><Plus className="size-4 mr-2" /> Create Broadcast</DropdownMenuItem>
        {items.length === 0 ? <DropdownMenuItem>Belum ada chat</DropdownMenuItem> : items.slice(0, 6).map((chat) => <DropdownMenuItem key={chat.id} className="flex-col items-start"><span className="font-medium">{chat.title}</span><span className="text-xs uppercase text-muted-foreground">{chat.kind}</span><span className="text-xs text-muted-foreground mt-1 line-clamp-2">{chat.latestMessage}</span></DropdownMenuItem>)}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/chat" />}>Open Chat Center</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
