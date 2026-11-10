import {
  ArrowRight,
  ClipboardCheck,
  Banknote,
  Clock,
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
import { getDashboardSummary, getInvoices, getLeads, getQuotations } from "@/lib/data";
import { getClientPoList } from "@/lib/po";
import { getCurrentUser } from "@/lib/session-auth";
import { formatCurrency } from "@/lib/format";

export default async function Dashboard() {
  try {
    const [summary, leads, invoices, charts, poList, quotations, user] = await Promise.all([
      getDashboardSummary(),
      getLeads(),
      getInvoices(),
      getDashboardChartData(),
      getClientPoList(),
      getQuotations(),
      getCurrentUser(),
    ]);
    const lihatUang = ["admin", "finance"].includes(user?.role ?? "");
    const poJalan = poList.filter((po) => !po.selesai);
    const sudahPo = new Set(poList.map((po) => po.quotationId));
    const nungguPo = quotations.filter((q) => q.status === "Sent" && !sudahPo.has(q.id));

    const { totalRevenue, outstandingInvoices } = summary;

    // Recent activity now reflects real DB state (last 4 records across leads, projects, invoices, payments).
    const recentInvoices = lihatUang ? invoices.slice(0, 2) : [];
    const recentLeads = leads.slice(0, 2);

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Beranda</h1>
            <p className="text-muted-foreground mt-1">Ringkasan kerjaan dan uang tahun {charts.year}.</p>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          {lihatUang ? (
            <>
              <ClickableStatCard
                href="/invoices"
                title="Total tagihan terbit"
                value={formatCurrency(totalRevenue)}
                hint={
                  <span className="text-green-600 font-medium inline-flex items-center">
                    <TrendingUp className="size-3 mr-1" /> semua invoice yang udah diterbitkan
                  </span>
                }
                icon={<Banknote className="size-5" />}
                accentClassName="bg-blue-50 text-blue-600"
              />
              <ClickableStatCard
                href="/invoices?type=Overdue"
                title="Belum dibayar klien"
                value={formatCurrency(outstandingInvoices)}
                hint="Perlu ditagih"
                icon={<Clock className="size-5" />}
                accentClassName="bg-amber-50 text-amber-600"
              />
            </>
          ) : null}
          <ClickableStatCard
            href="/po"
            title="PO belum selesai"
            value={poJalan.length}
            hint={`dari ${poList.length} PO klien`}
            icon={<ClipboardCheck className="size-5" />}
            accentClassName="bg-purple-50 text-purple-600"
          />
          <ClickableStatCard
            href="/quotations?type=Sent"
            title="Penawaran nunggu PO"
            value={nungguPo.length}
            hint={formatCurrency(nungguPo.reduce((sum, q) => sum + (q.total ?? 0), 0))}
            icon={<Landmark className="size-5" />}
            accentClassName="bg-emerald-50 text-emerald-600"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {lihatUang ? <DashboardCharts revenueData={charts.revenueData} cashflowData={charts.cashflowData} /> : null}

          <div className={lihatUang ? "space-y-6" : "lg:col-span-3 grid gap-6 lg:grid-cols-2 items-start"}>
            <Card className="border-border/60">
              <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">PO belum selesai</CardTitle>
                <a href="/po" className="text-sm font-medium text-primary inline-flex items-center gap-1">
                  Semua <ArrowRight className="size-4" />
                </a>
              </CardHeader>
              <CardContent className="p-0">
                {poJalan.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Gak ada PO yang nyangkut.</p>
                ) : (
                  <div className="flex flex-col">
                    {poJalan.slice(0, 5).map((po) => (
                      <a key={po.id} href={`/po/${po.id}`} className="flex items-start justify-between gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-border/40 last:border-b-0">
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-800 truncate">{po.clientName}</span>
                          <span className="block text-xs text-slate-500 truncate">PO {po.poNumber}</span>
                        </span>
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 text-right max-w-[50%]">{po.posisi}</span>
                      </a>
                    ))}
                  </div>
                )}
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
