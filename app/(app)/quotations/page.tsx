import { CheckCircle, Clock, FileSignature, FileX } from "lucide-react";

import { ClickableStatCard } from "@/components/cards/clickable-stat-card";
import { QuotationDialog } from "@/components/forms/project-quotation-dialogs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { QuotationActionsTable } from "@/components/quotations/quotation-actions";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getProjects, getQuotations } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientOptions } from "@/lib/options";
import { getClientPoList } from "@/lib/po";
import { getAppSettings } from "@/lib/settings";

export default async function QuotationsPage({ searchParams }: { searchParams?: Promise<{ q?: string; period?: string; type?: string }> }) {
  try {
    const params = (await searchParams) ?? {};
    const [quotations, clients, projects, settings, poList] = await Promise.all([getQuotations(), getClientOptions(), getProjects(), getAppSettings(), getClientPoList()]);
    const poByQuotation = Object.fromEntries(poList.map((po) => [po.quotationId, { id: po.id, poNumber: po.poNumber }]));
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Penawaran</h1>
            <p className="text-muted-foreground mt-1">Penawaran harga ke klien. Begitu klien kirim PO atau kontrak, klik "Catat PO klien".</p>
          </div>
          <QuotationDialog clients={clients} projects={projects.map((project) => ({ id: project.id, name: project.name, clientId: project.clientId, clientName: project.clientName }))} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ClickableStatCard href="/quotations" title="Semua penawaran" value={totalQuotations} hint="Lihat semua penawaran" icon={<FileSignature className="size-5" />} accentClassName="bg-blue-50 text-blue-600" />
          <ClickableStatCard href="/quotations?type=Accepted" title="Diterima" value={acceptedQuotations} hint="Penawaran yang diterima klien" icon={<CheckCircle className="size-5" />} accentClassName="bg-emerald-50 text-emerald-600" />
          <ClickableStatCard href="/quotations?type=Sent" title="Nilai nunggu jawaban" value={formatCurrency(pendingValue)} hint="Penawaran terkirim, belum ada jawaban" icon={<Clock className="size-5" />} accentClassName="bg-amber-50 text-amber-600" />
          <ClickableStatCard href="/quotations?type=Rejected" title="Ditolak" value={rejectedQuotations} hint="Penawaran yang ditolak klien" icon={<FileX className="size-5" />} accentClassName="bg-rose-50 text-rose-600" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border p-4 md:p-6">
          {quotations.length === 0 ? (
            <EmptyState
              title="Belum ada penawaran"
              description="Penawaran yang dibikin tim sales bakal muncul di sini."
            />
          ) : (
            <QuotationActionsTable poByQuotation={poByQuotation} quotations={quotations} clients={clients} projects={projects.map((project) => ({ id: project.id, name: project.name, clientId: project.clientId, clientName: project.clientName }))} settings={{ companyName: settings.companyName, companyEmail: settings.companyEmail, companyPhone: settings.companyPhone, companyAddress: settings.companyAddress, defaultSignatoryName: settings.defaultSignatoryName, defaultSignatoryTitle: settings.defaultSignatoryTitle, signatureImageUrl: settings.signatureImageUrl, stampImageUrl: settings.stampImageUrl, quotationSignatoryName: settings.quotationSignatoryName, quotationSignatoryTitle: settings.quotationSignatoryTitle, quotationSignatureImageUrl: settings.quotationSignatureImageUrl }} filters={{ initialQuery: params.q, initialPeriod: (params.period as "all" | "30d" | "month" | "year") ?? "all", initialType: params.type ?? "all" }} />
          )}
        </div>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState
          title="Gagal memuat penawaran"
          description={error instanceof Error ? error.message : "Ada error waktu membaca data penawaran."}
        />
      </PageWrapper>
    );
  }
}
