import { Banknote, Target, TrendingUp, Users } from "lucide-react";

import { ClickableStatCard } from "@/components/cards/clickable-stat-card";
import { CreateLeadDialog } from "@/components/forms/crud-dialogs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { FilterableLeadsTable } from "@/components/tables/filterable-lists";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getLeads } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientOptions } from "@/lib/options";

export default async function CRMPage({ searchParams }: { searchParams?: Promise<{ q?: string; period?: string; type?: string }> }) {
  try {
    const params = (await searchParams) ?? {};
    const [leads, clients] = await Promise.all([getLeads(), getClientOptions()]);
    const totalLeads = leads.length;
    const wonLeads = leads.filter((lead) => lead.status === "Won").length;
    const openValue = leads
      .filter((lead) => lead.status !== "Won" && lead.status !== "Lost")
      .reduce((acc, curr) => acc + curr.estimatedValue, 0);
    const winRate = Math.round((wonLeads / totalLeads) * 100) || 0;

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Lead Management</h1>
            <p className="text-muted-foreground mt-1">Manage and track your prospect pipeline easily.</p>
          </div>
          <CreateLeadDialog clients={clients} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ClickableStatCard href="/leads" title="Total Leads" value={totalLeads} hint="Lihat semua pipeline" icon={<Users className="size-5" />} accentClassName="bg-blue-50 text-blue-600" />
          <ClickableStatCard href="/leads?type=Won" title="Deals Won" value={wonLeads} hint="Filter lead menang" icon={<Target className="size-5" />} accentClassName="bg-emerald-50 text-emerald-600" />
          <ClickableStatCard href="/leads?type=Negotiation" title="Pipeline Value" value={formatCurrency(openValue).replace(',00', '')} hint="Fokus pipeline aktif" icon={<Banknote className="size-5" />} accentClassName="bg-purple-50 text-purple-600" />
          <ClickableStatCard href="/leads?type=Won&period=year" title="Win Rate" value={`${winRate}%`} hint="Lead won tahun ini" icon={<TrendingUp className="size-5" />} accentClassName="bg-amber-50 text-amber-600" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
          {leads.length === 0 ? (
            <EmptyState
              title="Belum ada data leads"
              description="Database sudah tersambung, tapi tabel leads masih kosong. Jalankan seed atau mulai input data operasional." 
            />
          ) : (
            <FilterableLeadsTable leads={leads} clients={clients} filters={{ initialQuery: params.q, initialPeriod: (params.period as "all" | "30d" | "month" | "year") ?? "all", initialType: params.type ?? "all" }} />
          )}
        </div>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState
          title="Gagal memuat leads"
          description={error instanceof Error ? error.message : "Terjadi error saat membaca data leads dari database."}
        />
      </PageWrapper>
    );
  }
}
