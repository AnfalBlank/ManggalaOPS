import { Banknote, ShieldCheck } from "lucide-react";

import { ClickableStatCard } from "@/components/cards/clickable-stat-card";
import { RecordPaymentDialog } from "@/components/forms/crud-dialogs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { FilterablePaymentsTable } from "@/components/tables/filterable-lists";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getPayments } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientOptions, getPaymentAccountOptions } from "@/lib/options";
import { getAppSettings } from "@/lib/settings";

export default async function PaymentsPage({ searchParams }: { searchParams?: Promise<{ q?: string; period?: string; type?: string }> }) {
  try {
    const params = (await searchParams) ?? {};
    const [payments, clients, settings, invoiceModule, paymentAccounts] = await Promise.all([
      getPayments(),
      getClientOptions(),
      getAppSettings(),
      import("@/lib/data"),
      getPaymentAccountOptions(),
    ]);
    const invoiceRows = await invoiceModule.getInvoices();
    const invoices = invoiceRows.map((invoice) => ({ id: invoice.id, code: invoice.code, clientId: invoice.clientId, clientName: invoice.clientName }));
    const totalPayments = payments.length;
    const totalValueReceived = payments.reduce((acc, curr) => acc + curr.amount, 0);

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Pembayaran masuk</h1>
            <p className="text-muted-foreground mt-1">Catat uang yang masuk dari klien dan cetak kwitansinya.</p>
          </div>
          <RecordPaymentDialog clients={clients} invoices={invoices} paymentAccounts={paymentAccounts} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ClickableStatCard href="/payments" title="Jumlah pembayaran" value={totalPayments} hint="Lihat semua pembayaran" icon={<Banknote className="size-5" />} accentClassName="bg-emerald-50 text-emerald-600" />
          <div className="md:col-span-2">
            <ClickableStatCard href="/payments?period=month" title="Total uang diterima" value={formatCurrency(totalValueReceived)} hint="Semua waktu (klik: bulan ini)" icon={<ShieldCheck className="size-5" />} accentClassName="bg-blue-50 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border p-4 md:p-6">
          {payments.length === 0 ? (
            <EmptyState
              title="Belum ada pembayaran"
              description="Belum ada pembayaran yang dicatat. Begitu pembayaran dicatat, datanya muncul di sini."
            />
          ) : (
            <FilterablePaymentsTable payments={payments} clients={clients} invoices={invoices} settings={{ companyName: settings.companyName, companyEmail: settings.companyEmail, companyPhone: settings.companyPhone, companyAddress: settings.companyAddress, defaultSignatoryName: settings.defaultSignatoryName, defaultSignatoryTitle: settings.defaultSignatoryTitle, signatureImageUrl: settings.signatureImageUrl, stampImageUrl: settings.stampImageUrl }} filters={{ initialQuery: params.q, initialPeriod: (params.period as "all" | "30d" | "month" | "year") ?? "all", initialType: params.type ?? "all" }} />
          )}
        </div>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState
          title="Gagal memuat pembayaran"
          description={error instanceof Error ? error.message : "Ada error saat membaca data pembayaran."}
        />
      </PageWrapper>
    );
  }
}
