"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FolderKanban,
  FileSignature,
  FileText,
  LineChart,
  Settings,
  UserCog,
  Building2,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AppRole } from "@/lib/auth";
import { canAccessPath } from "@/lib/role-access";

type Sub = { title: string; url: string };
const navItems: { title: string; url: string; icon: typeof LayoutDashboard; sub?: Sub[] }[] = [
  { title: "Beranda", url: "/", icon: LayoutDashboard },
  { title: "Klien", url: "/clients", icon: Building2, sub: [{ title: "Calon klien", url: "/leads" }] },
  { title: "Penawaran", url: "/quotations", icon: FileSignature, sub: [{ title: "Kalkulator untung", url: "/calculator" }] },
  { title: "PO klien", url: "/po", icon: ClipboardCheck, sub: [{ title: "Surat jalan", url: "/delivery-orders" }] },
  { title: "Proyek", url: "/projects", icon: FolderKanban },
  { title: "Tagihan", url: "/invoices", icon: FileText, sub: [{ title: "Pembayaran masuk", url: "/payments" }] },
  {
    title: "Keuangan",
    url: "/finance",
    icon: LineChart,
    sub: [
      { title: "Akuntansi", url: "/accounting" },
      { title: "Laporan", url: "/reports" },
    ],
  },
  { title: "Pengguna", url: "/users", icon: UserCog },
];

function aktif(pathname: string, url: string) {
  return url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");
}

function getInitials(name?: string) {
  if (!name) return "MU";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "MU";
}

export function AppSidebar({ role = "admin", user }: { role?: string; user?: { name: string; email: string } }) {
  const pathname = usePathname();
  const normalizedRole = (role ?? "admin") as AppRole;
  // Menu utama tampil kalau jabatan boleh buka menu itu atau salah satu sub-menunya.
  const visibleItems = navItems
    .map((item) => ({ ...item, sub: item.sub?.filter((sub) => canAccessPath(normalizedRole, sub.url)) }))
    .filter((item) => canAccessPath(normalizedRole, item.url) || (item.sub?.length ?? 0) > 0)
    .map((item) => (canAccessPath(normalizedRole, item.url) ? item : { ...item, url: item.sub![0].url }));

  return (
    <Sidebar className="border-r-0 shadow-xl" variant="sidebar">
      <div className="flex h-full w-full flex-col bg-[#0A1128] bg-gradient-to-b from-[#0A1128] to-[#0F172A] text-slate-300">
        <SidebarHeader className="py-6 px-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-10 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#249EF0]">
                <circle cx="50" cy="18" r="11" fill="currentColor" />
                <path d="M 18 36 L 40 22 L 50 32 L 40 42 L 34 36 L 34 58 L 18 58 Z" fill="currentColor" />
                <path d="M 82 36 L 60 22 L 50 32 L 60 42 L 66 36 L 66 58 L 82 58 Z" fill="currentColor" />
                <path d="M 18 64 L 34 64 L 34 78 L 50 90 L 66 78 L 66 64 L 82 64 L 82 68 L 66 82 L 50 96 L 34 82 L 18 68 Z" fill="currentColor" />
                <path d="M 43 40 L 57 40 L 57 82 L 50 88 L 43 82 Z" fill="currentColor" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-black text-[15px] tracking-wide text-white leading-tight uppercase font-sans">PT. Manggala</span>
              <span className="text-[10px] tracking-[0.2em] text-[#249EF0] font-bold uppercase mt-0.5">Utama Indonesia</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase font-bold text-blue-300/50 mb-2 px-4 tracking-wider">Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-2">
                {visibleItems.map((item) => {
                  const isActive = aktif(pathname, item.url);
                  const diBagian = isActive || (item.sub ?? []).some((sub) => aktif(pathname, sub.url));
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        tooltip={item.title}
                        className={`h-10 rounded-lg flex items-center gap-3 px-3 transition-all duration-200 group ${isActive ? "bg-blue-600/10 text-white font-medium relative" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"}`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-md shadow-[0_0_10px_2px_rgba(59,130,246,0.3)]" />
                        )}
                        <item.icon className={`size-[18px] transition-colors ${isActive ? "text-blue-500" : "text-slate-500 group-hover:text-blue-400"}`} />
                        <span className="text-sm">{item.title}</span>
                      </SidebarMenuButton>
                      {diBagian && item.sub && item.sub.length > 0 ? (
                        <div className="ml-9 mt-1 mb-1 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                          {item.sub.map((sub) => (
                            <Link
                              key={sub.url}
                              href={sub.url}
                              className={`rounded-md px-2 py-1.5 text-[13px] transition-colors ${aktif(pathname, sub.url) ? "text-white bg-blue-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
                            >
                              {sub.title}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {canAccessPath(normalizedRole, "/audit-log") || canAccessPath(normalizedRole, "/settings") ? (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="text-[10px] uppercase font-bold text-blue-300/50 mb-2 px-4 tracking-wider">Sistem</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-2">
                {canAccessPath(normalizedRole, "/audit-log") ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/audit-log" />}
                      className={`h-10 rounded-lg flex items-center gap-3 px-3 transition-all duration-200 group ${
                        pathname === "/audit-log"
                          ? "bg-blue-600/10 text-white font-medium relative"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      }`}
                    >
                      <ShieldCheck className="size-[18px] text-slate-500 group-hover:text-amber-300 transition-colors" />
                      <span className="text-sm">Log aktivitas</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
                {canAccessPath(normalizedRole, "/settings") ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/settings" />}
                      className="h-10 rounded-lg flex items-center gap-3 px-3 transition-all duration-200 text-slate-400 group hover:bg-slate-800/50 hover:text-slate-200"
                    >
                      <Settings className="size-[18px] text-slate-500 group-hover:text-slate-300 transition-colors" />
                      <span className="text-sm">Setelan</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          ) : null}
        </SidebarContent>

        <div className="p-4 mt-auto border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="size-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
              <span className="text-white text-xs font-bold">{getInitials(user?.name)}</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-white truncate group-hover:text-blue-100 transition-colors">{user?.name ?? "Manggala Ops"}</span>
              <span className="text-xs text-slate-400 truncate group-hover:text-slate-300">{user?.email ?? "ops@manggala-utama.id"}</span>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
