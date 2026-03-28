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
  Users,
  FolderKanban,
  FileSignature,
  FileText,
  Banknote,
  LineChart,
  BookMarked,
  PieChart,
  Settings,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Leads",
    url: "/leads",
    icon: Users,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Quotations",
    url: "/quotations",
    icon: FileSignature,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: FileText,
  },
  {
    title: "Payments",
    url: "/payments",
    icon: Banknote,
  },
  {
    title: "Finance",
    url: "/finance",
    icon: LineChart,
  },
  {
    title: "Accounting",
    url: "/accounting",
    icon: BookMarked,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: PieChart,
  },
  {
    title: "Users",
    url: "/users",
    icon: UserCog,
  },
];

export function AppSidebar({ role = "admin" }: { role?: string }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => {
    if (role === "admin") return true;
    if (role === "finance") return ["/", "/invoices", "/payments", "/finance", "/accounting", "/reports"].includes(item.url);
    if (role === "sales") return ["/", "/leads", "/projects", "/quotations", "/invoices", "/reports"].includes(item.url);
    if (role === "project_manager") return ["/", "/projects", "/reports"].includes(item.url);
    return true;
  });

  return (
    <Sidebar className="border-r-0">
      {/* 
        We use a solid dark blue base with a very subtle gradient towards the bottom/right 
        to add depth without making it look "flashy".
      */}
      <div className="flex h-full w-full flex-col bg-[#0A1128] bg-gradient-to-b from-[#0A1128] to-[#0F172A] text-slate-300">
        <SidebarHeader className="py-6 px-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-10 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#249EF0]">
                {/* Top Circle */}
                <circle cx="50" cy="18" r="11" fill="currentColor" />
                {/* Left Pillar */}
                <path d="M 18 36 L 40 22 L 50 32 L 40 42 L 34 36 L 34 58 L 18 58 Z" fill="currentColor" />
                {/* Right Pillar */}
                <path d="M 82 36 L 60 22 L 50 32 L 60 42 L 66 36 L 66 58 L 82 58 Z" fill="currentColor" />
                {/* Lower Blocks */}
                <path d="M 18 64 L 34 64 L 34 78 L 50 90 L 66 78 L 66 64 L 82 64 L 82 68 L 66 82 L 50 96 L 34 82 L 18 68 Z" fill="currentColor" />
                {/* Center Stem */}
                <path d="M 43 40 L 57 40 L 57 82 L 50 88 L 43 82 Z" fill="currentColor" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-black text-[15px] tracking-wide text-white leading-tight uppercase font-sans">
                PT. Manggala
              </span>
              <span className="text-[10px] tracking-[0.2em] text-[#249EF0] font-bold uppercase mt-0.5">
                Utama Indonesia
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase font-bold text-blue-300/50 mb-2 px-4 tracking-wider">
              Main Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-2">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        render={<Link href={item.url} />} 
                        tooltip={item.title}
                        className={`h-10 rounded-lg flex items-center gap-3 px-3 transition-all duration-200 group
                          ${isActive 
                            ? "bg-blue-600/10 text-white font-medium relative" 
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                          }
                        `}
                      >
                        {/* Active glow accent */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-md shadow-[0_0_10px_2px_rgba(59,130,246,0.3)]" />
                        )}
                        <item.icon className={`size-[18px] transition-colors ${isActive ? "text-blue-500" : "text-slate-500 group-hover:text-blue-400"}`} />
                        <span className="text-sm">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="text-[10px] uppercase font-bold text-blue-300/50 mb-2 px-4 tracking-wider">
              System
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-2">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    render={<Link href="/settings" />}
                    className="h-10 rounded-lg flex items-center gap-3 px-3 transition-all duration-200 text-slate-400 group hover:bg-slate-800/50 hover:text-slate-200"
                  >
                    <Settings className="size-[18px] text-slate-500 group-hover:text-slate-300 transition-colors" />
                    <span className="text-sm">Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* User Profile at the bottom for structural strength */}
        <div className="p-4 mt-auto border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="size-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
              <span className="text-white text-xs font-bold">AD</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-white truncate group-hover:text-blue-100 transition-colors">Admin Ops</span>
              <span className="text-xs text-slate-400 truncate group-hover:text-slate-300">admin@manggala.co.id</span>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
