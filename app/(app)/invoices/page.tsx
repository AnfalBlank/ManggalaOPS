import { AlertCircle, Banknote, FileCheck, Landmark } from "lucide-react";

import { ClickableStatCard } from "@/components/cards/clickable-stat-card";
import { InvoiceDialog } from "@/components/forms/invoice-dialogs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { FilterableInvoicesTable } from "@/components/tables/filterable-lists";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getInvoices } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientOptions } from "@/lib/options";
import { getAppSettings } from "@/lib/settings";
import type { InvoiceListItem } from "@/lib/types";

export default async function InvoicesPage({ searchParams }: { searchParams?: Promise<{ q?: string; period?: string; type?: string }> }) {
  try {
    const params = (await searchParams) ?? {};
    const [invoiceRows, clients, settings] = await Promise.all([getInvoices(), getClientOptions(), getAppSettings()]);
    const invoices = invoiceRows as InvoiceListItem[];
    const totalInvoices = invoices.length;
    const totalValue = invoices.reduce((acc, curr) => acc + curr.total, 0);
    const totalPaid = invoices.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const unpaidValue = invoices.reduce((acc, curr) => acc + curr.outstandingAmount, 0);

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Invoices</h1>
            <p className="text-muted-foreground mt-1">Manage billings and track outstanding payments.</p>
          </div>
          <InvoiceDialog clients={clients} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ClickableStatCard href="/invoices" title="Total Invoices" value={totalInvoices} hint="Lihat semua invoice" icon={<FileCheck className="size-5" />} accentClassName="bg-blue-50 text-blue-600" />
          <ClickableStatCard href="/invoices?period=year" title="Value Issued" value={formatCurrency(totalValue).replace(',00', '')} hint="Invoice tahun ini" icon={<Landmark className="size-5" />} accentClassName="bg-purple-50 text-purple-600" />
          <ClickableStatCard href="/invoices?type=Paid" title="Total Paid" value={formatCurrency(totalPaid).replace(',00', '')} hint="Filter invoice lunas" icon={<Banknote className="size-5" />} accentClassName="bg-emerald-50 text-emerald-600" />
          <ClickableStatCard href="/invoices?type=Overdue" title="Outstanding" value={formatCurrency(unpaidValue).replace(',00', '')} hint="Butuh follow up" icon={<AlertCircle className="size-5" />} accentClassName="bg-rose-50 text-rose-600" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border p-4 md:p-6">
          {invoices.length === 0 ? (
            <EmptyState
              title="Belum ada data invoices"
              description="Belum ada invoice yang diterbitkan. Setelah sales atau finance membuat invoice, datanya akan tampil di sini."
            />
          ) : (
            <FilterableInvoicesTable invoices={invoices} clients={clients} settings={{ companyName: settings.companyName, companyEmail: settings.companyEmail, companyPhone: settings.companyPhone, companyAddress: settings.companyAddress, defaultSignatoryName: settings.defaultSignatoryName, defaultSignatoryTitle: settings.defaultSignatoryTitle }} filters={{ initialQuery: params.q, initialPeriod: (params.period as "all" | "30d" | "month" | "year") ?? "all", initialType: params.type ?? "all" }} />
          )}
        </div>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState
          title="Gagal memuat invoices"
          description={error instanceof Error ? error.message : "Terjadi error saat membaca data invoice dari database."}
        />
      </PageWrapper>
    );
  }
}
