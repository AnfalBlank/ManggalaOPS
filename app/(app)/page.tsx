import {
  ArrowRight,
  Banknote,
  Clock,
  FolderKanban,
  Landmark,
  TrendingUp,
  Users,
} from "lucide-react";

import { ClickableStatCard } from "@/components/cards/clickable-stat-card";
import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/state";
import { getDashboardChartData } from "@/lib/dashboard-charts";
import { getDashboardSummary, getInvoices, getLeads, getProjects } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default async function Dashboard() {
  try {
    const [summary, leads, projects, invoices, charts] = await Promise.all([
      getDashboardSummary(),
      getLeads(),
      getProjects(),
      getInvoices(),
      getDashboardChartData(),
    ]);

    const { totalLeads, wonLeads, totalRevenue, outstandingInvoices } = summary;

    // Recent activity now reflects real DB state (last 4 records across leads, projects, invoices, payments).
    const recentInvoices = invoices.slice(0, 2);
    const recentLeads = leads.slice(0, 2);

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1">Monitor performa bisnis tahun {charts.year} secara real-time.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <ClickableStatCard
            href="/finance?type=income"
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            hint={
              <span className="text-green-600 font-medium inline-flex items-center">
                <TrendingUp className="size-3 mr-1" /> total invoice yang sudah diterbitkan
              </span>
            }
            icon={<Banknote className="size-5" />}
            accentClassName="bg-blue-50 text-blue-600"
          />
          <ClickableStatCard
            href="/invoices?type=Overdue"
            title="Outstanding Invoices"
            value={formatCurrency(outstandingInvoices)}
            hint="Perlu follow-up payment"
            icon={<Clock className="size-5" />}
            accentClassName="bg-amber-50 text-amber-600"
          />
          <ClickableStatCard
            href="/leads"
            title="Total Leads"
            value={totalLeads}
            hint={`${leads.length} records di database`}
            icon={<Users className="size-5" />}
            accentClassName="bg-purple-50 text-purple-600"
          />
          <ClickableStatCard
            href="/leads?type=Won"
            title="Deals Won"
            value={wonLeads}
            hint={
              <>
                <span className="font-medium mr-1 text-primary">
                  {Math.round((wonLeads / Math.max(totalLeads, 1)) * 100) || 0}%
                </span>{" "}
                win rate
              </>
            }
            icon={<Landmark className="size-5" />}
            accentClassName="bg-emerald-50 text-emerald-600"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <DashboardCharts revenueData={charts.revenueData} cashflowData={charts.cashflowData} />

          <div className="space-y-6">
            <Card className="border-border/60 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-50" />
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-semibold">Quick Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3 relative z-10">
                <a href="/leads" className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-border shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                    <Users className="size-5 text-blue-600" />
                  </div>
                  {leads.length} Leads
                </a>
                <a href="/projects" className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-border shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                    <FolderKanban className="size-5 text-emerald-600" />
                  </div>
                  {projects.length} Projects
                </a>
                <a href="/invoices" className="col-span-2 w-full flex items-center justify-between p-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:opacity-95 transition-opacity cursor-pointer">
                  <span>{invoices.length} invoices tersinkron</span>
                  <ArrowRight className="size-4 opacity-70" />
                </a>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-semibold">Aktivitas Terbaru</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {recentInvoices.map((invoice) => (
                    <a
                      key={`inv-${invoice.id}`}
                      href={`/invoices?q=${encodeURIComponent(invoice.code)}`}
                      className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-border/40"
                    >
                      <div className="mt-0.5 size-8 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Banknote className="size-4 text-emerald-600" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {invoice.code} • {invoice.clientName}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          {formatCurrency(invoice.total)} • {invoice.status}
                        </span>
                      </div>
                    </a>
                  ))}
                  {recentLeads.map((lead, i) => (
                    <a
                      key={`lead-${lead.id}`}
                      href="/leads"
                      className={`flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors ${
                        i === recentLeads.length - 1 ? "" : "border-b border-border/40"
                      }`}
                    >
                      <div className="mt-0.5 size-8 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="size-4 text-blue-600" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {lead.code} • {lead.clientName}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          {lead.serviceName} • {lead.status}
                        </span>
                      </div>
                    </a>
                  ))}
                  {recentInvoices.length === 0 && recentLeads.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Belum ada aktivitas. Mulai dari menambah lead atau invoice.
                    </div>
                  ) : null}
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
