import { CheckCircle, Clock, FileSignature, FileX } from "lucide-react";

import { ClickableStatCard } from "@/components/cards/clickable-stat-card";
import { QuotationDialog } from "@/components/forms/project-quotation-dialogs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { QuotationActionsTable } from "@/components/quotations/quotation-actions";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getProjects, getQuotations } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientOptions } from "@/lib/options";
import { getAppSettings } from "@/lib/settings";

export default async function QuotationsPage({ searchParams }: { searchParams?: Promise<{ q?: string; period?: string; type?: string }> }) {
  try {
    const params = (await searchParams) ?? {};
    const [quotations, clients, projects, settings] = await Promise.all([getQuotations(), getClientOptions(), getProjects(), getAppSettings()]);
    const totalQuotations = quotations.length;
    const acceptedQuotations = quotations.filter((quotation) => quotation.status === "Accepted").length;
    const pendingValue = quotations
      .filter((quotation) => quotation.status === "Sent")
      .reduce((sum, quotation) => sum + quotation.total, 0);
    const rejectedQuotations = quotations.filter((quotation) => quotation.status === "Rejected").length;

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Quotations</h1>
            <p className="text-muted-foreground mt-1">Manage service and procurement quotes sent to clients.</p>
          </div>
          <QuotationDialog clients={clients} projects={projects.map((project) => ({ id: project.id, name: project.name, clientId: project.clientId, clientName: project.clientName }))} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ClickableStatCard href="/quotations" title="Total Quotes" value={totalQuotations} hint="Lihat semua quotation" icon={<FileSignature className="size-5" />} accentClassName="bg-blue-50 text-blue-600" />
          <ClickableStatCard href="/quotations?type=Accepted" title="Accepted" value={acceptedQuotations} hint="Quotation diterima" icon={<CheckCircle className="size-5" />} accentClassName="bg-emerald-50 text-emerald-600" />
          <ClickableStatCard href="/quotations?type=Sent" title="Pending Value" value={formatCurrency(pendingValue).replace(',00', '')} hint="Quotation menunggu closing" icon={<Clock className="size-5" />} accentClassName="bg-amber-50 text-amber-600" />
          <ClickableStatCard href="/quotations?type=Rejected" title="Rejected" value={rejectedQuotations} hint="Quotation ditolak" icon={<FileX className="size-5" />} accentClassName="bg-rose-50 text-rose-600" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border p-4 md:p-6">
          {quotations.length === 0 ? (
            <EmptyState
              title="Belum ada data quotations"
              description="Tabel quotations masih kosong. Setelah tim sales bikin penawaran atau seed dijalankan, datanya akan muncul di sini."
            />
          ) : (
            <QuotationActionsTable quotations={quotations} clients={clients} projects={projects.map((project) => ({ id: project.id, name: project.name, clientId: project.clientId, clientName: project.clientName }))} settings={{ companyName: settings.companyName, companyEmail: settings.companyEmail, companyPhone: settings.companyPhone, companyAddress: settings.companyAddress, defaultSignatoryName: settings.defaultSignatoryName, defaultSignatoryTitle: settings.defaultSignatoryTitle }} filters={{ initialQuery: params.q, initialPeriod: (params.period as "all" | "30d" | "month" | "year") ?? "all", initialType: params.type ?? "all" }} />
          )}
        </div>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState
          title="Gagal memuat quotations"
          description={error instanceof Error ? error.message : "Terjadi error saat membaca data quotation dari database."}
        />
      </PageWrapper>
    );
  }
}
