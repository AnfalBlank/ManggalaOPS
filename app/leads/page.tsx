import { Banknote, Target, TrendingUp, Users } from "lucide-react";

import { CreateLeadDialog } from "@/components/forms/crud-dialogs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { FilterableLeadsTable } from "@/components/tables/filterable-lists";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getLeads } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientOptions } from "@/lib/options";

export default async function CRMPage() {
  try {
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
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Leads</p>
                <h3 className="text-xl font-bold text-slate-800">{totalLeads}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Target className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Deals Won</p>
                <h3 className="text-xl font-bold text-slate-800">{wonLeads}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Banknote className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pipeline Value</p>
                <h3 className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(openValue).replace(',00', '')}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <TrendingUp className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Win Rate</p>
                <h3 className="text-xl font-bold text-slate-800">{winRate}%</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
          {leads.length === 0 ? (
            <EmptyState
              title="Belum ada data leads"
              description="Database sudah tersambung, tapi tabel leads masih kosong. Jalankan seed atau mulai input data operasional." 
            />
          ) : (
            <FilterableLeadsTable leads={leads} clients={clients} />
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
