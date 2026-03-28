import {
  Activity,
  ArrowRight,
  Banknote,
  Clock,
  FilePlus,
  FolderKanban,
  Landmark,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/state";
import { getDashboardSummary, getInvoices, getLeads, getProjects } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

const recentActivities = [
  { id: 1, title: "Seed endpoint ready", desc: "POST /api/seed untuk isi data awal database", time: "backend", icon: UserPlus, color: "text-blue-600", bg: "bg-blue-100" },
  { id: 2, title: "Invoice data live", desc: "Halaman invoices sekarang baca dari Drizzle + Turso", time: "integration", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-100" },
  { id: 3, title: "Project tracking connected", desc: "Projects page sudah pakai data real", time: "integration", icon: FolderKanban, color: "text-purple-600", bg: "bg-purple-100" },
  { id: 4, title: "API routes available", desc: "Leads, projects, quotations, invoices, payments", time: "api", icon: FilePlus, color: "text-amber-600", bg: "bg-amber-100" },
];

const revenueData = [
  { name: "Jan", total: 120000000 },
  { name: "Feb", total: 180000000 },
  { name: "Mar", total: 240000000 },
  { name: "Apr", total: 450000000 },
  { name: "May", total: 320000000 },
  { name: "Jun", total: 570000000 },
];

const cashflowData = [
  { name: "Jan", in: 150000000, out: 80000000 },
  { name: "Feb", in: 200000000, out: 120000000 },
  { name: "Mar", in: 280000000, out: 150000000 },
  { name: "Apr", in: 480000000, out: 210000000 },
  { name: "May", in: 350000000, out: 190000000 },
  { name: "Jun", in: 610000000, out: 240000000 },
];

export default async function Dashboard() {
  try {
    const [summary, leads, projects, invoices] = await Promise.all([
      getDashboardSummary(),
      getLeads(),
      getProjects(),
      getInvoices(),
    ]);

    const totalLeads = summary.totalLeads;
    const wonLeads = summary.wonLeads;
    const totalRevenue = summary.totalRevenue;
    const outstandingInvoices = summary.outstandingInvoices;

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1">Monitor your business performance in real-time.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="h-full">
            <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Banknote className="size-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-green-600 flex items-center mt-1 font-medium">
                  <TrendingUp className="size-3 mr-1" /> realtime from issued invoices
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="h-full">
            <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Invoices</CardTitle>
                <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <Clock className="size-5 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(outstandingInvoices)}</div>
                <p className="text-xs text-amber-600 flex items-center mt-1 font-medium">Requires follow-up</p>
              </CardContent>
            </Card>
          </div>

          <div className="h-full">
            <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                <div className="size-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Users className="size-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLeads}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">{leads.length} records available</p>
              </CardContent>
            </Card>
          </div>

          <div className="h-full">
            <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Deals Won</CardTitle>
                <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Landmark className="size-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{wonLeads}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <span className="font-medium mr-1 text-primary">{Math.round((wonLeads / totalLeads) * 100) || 0}%</span> win rate
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <DashboardCharts revenueData={revenueData} cashflowData={cashflowData} />

          <div className="space-y-6">
            <Card className="border-border/60 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-50" />
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-semibold">Quick Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3 relative z-10">
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-border shadow-sm text-sm font-medium text-slate-700">
                  <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                    <Users className="size-5 text-blue-600" />
                  </div>
                  {leads.length} Leads
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-border shadow-sm text-sm font-medium text-slate-700">
                  <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                    <FolderKanban className="size-5 text-emerald-600" />
                  </div>
                  {projects.length} Projects
                </div>
                <div className="col-span-2 w-full flex items-center justify-between p-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm">
                  <span>{invoices.length} invoices synced to UI</span>
                  <ArrowRight className="size-4 opacity-70" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="size-4 text-purple-600" />
                  Backend Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {recentActivities.map((act, i) => (
                    <div key={act.id} className={`flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors ${i !== recentActivities.length - 1 ? "border-b border-border/40" : ""}`}>
                      <div className={`mt-0.5 size-8 shrink-0 rounded-full ${act.bg} flex items-center justify-center`}>
                        <act.icon className={`size-4 ${act.color}`} />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-semibold text-slate-800 truncate">{act.title}</span>
                        <span className="text-xs text-slate-500 truncate">{act.desc}</span>
                        <span className="text-[10px] text-slate-400 mt-1">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState
          title="Gagal memuat dashboard"
          description={error instanceof Error ? error.message : "Terjadi error saat memuat dashboard dari database."}
        />
      </PageWrapper>
    );
  }
}
