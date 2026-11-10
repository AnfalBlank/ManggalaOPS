"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LABEL_JABATAN } from "@/lib/label-status";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

const roleLabels = LABEL_JABATAN;

const SEARCH_TARGETS = [
  { keyword: "po klien", path: "/po" },
  { keyword: "surat jalan", path: "/delivery-orders" },
  { keyword: "calon klien", path: "/leads" },
  { keyword: "klien", path: "/clients" },
  { keyword: "proyek", path: "/projects" },
  { keyword: "penawaran", path: "/quotations" },
  { keyword: "tagihan", path: "/invoices" },
  { keyword: "pembayaran", path: "/payments" },
  { keyword: "pengeluaran", path: "/finance" },
  { keyword: "keuangan", path: "/finance" },
  { keyword: "akuntansi", path: "/accounting" },
  { keyword: "laporan", path: "/reports" },
  { keyword: "kalkulator", path: "/calculator" },
  { keyword: "pengguna", path: "/users" },
  { keyword: "setelan", path: "/settings" },
  { keyword: "lead", path: "/leads" },
  { keyword: "client", path: "/clients" },
  { keyword: "project", path: "/projects" },
  { keyword: "quotation", path: "/quotations" },
  { keyword: "quote", path: "/quotations" },
  { keyword: "invoice", path: "/invoices" },
  { keyword: "payment", path: "/payments" },
  { keyword: "kwitansi", path: "/payments" },
  { keyword: "po klien", path: "/po" },
  { keyword: "purchase order", path: "/po" },
  { keyword: "supplier", path: "/po" },
  { keyword: "surat jalan", path: "/delivery-orders" },
  { keyword: "delivery", path: "/delivery-orders" },
  { keyword: "expense", path: "/finance" },
  { keyword: "finance", path: "/finance" },
  { keyword: "accounting", path: "/accounting" },
  { keyword: "report", path: "/reports" },
  { keyword: "calculator", path: "/calculator" },
  { keyword: "user", path: "/users" },
  { keyword: "settings", path: "/settings" },
];

export function Topbar({ user }: { user?: { name: string; email: string; role: string; avatarUrl?: string } }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    const lower = value.toLowerCase();
    // Match keyword to known module page; fallback to clients with query.
    const match = SEARCH_TARGETS.find((target) => lower.includes(target.keyword));
    if (match) {
      // Strip the keyword from query so only the actual search term goes through.
      const term = lower.replace(match.keyword, "").trim();
      const url = term ? `${match.path}?q=${encodeURIComponent(term)}` : match.path;
      router.push(url);
    } else {
      // Default: search clients by name.
      router.push(`/clients?q=${encodeURIComponent(value)}`);
    }
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-30 w-full flex items-center h-16 px-4 border-b bg-white/95 backdrop-blur shrink-0 overflow-x-hidden">
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="md:hidden" />
        <div className="w-1 h-4 bg-border mx-2 hidden sm:block" />
        <form onSubmit={handleSearch} className="hidden lg:flex items-center text-sm text-muted-foreground font-medium w-72 min-w-0">
          <Search className="size-4 mr-2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari klien, tagihan, proyek..."
            className="border-none shadow-none focus-visible:ring-0 h-8 px-0 text-sm placeholder:text-muted-foreground/70"
          />
        </form>
      </div>

      <div className="ml-auto flex items-center gap-3 md:gap-4">
        {user ? (
          <div className="hidden md:block text-right">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-muted-foreground">{roleLabels[user.role] ?? user.role}</div>
          </div>
        ) : null}

        <NotificationsMenu />
        <ProfileMenu user={user} />
      </div>
    </header>
  );
}
