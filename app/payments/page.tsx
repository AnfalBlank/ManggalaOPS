import { Banknote, ShieldCheck } from "lucide-react";

import { RecordPaymentDialog } from "@/components/forms/crud-dialogs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { FilterablePaymentsTable } from "@/components/tables/filterable-lists";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getPayments } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientOptions, getInvoiceOptions } from "@/lib/options";

export default async function PaymentsPage() {
  try {
    const [payments, clients, invoices] = await Promise.all([
      getPayments(),
      getClientOptions(),
      getInvoiceOptions(),
    ]);
    const totalPayments = payments.length;
    const totalValueReceived = payments.reduce((acc, curr) => acc + curr.amount, 0);

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Payments</h1>
            <p className="text-muted-foreground mt-1">Track incoming payments and generate official receipts (Kwitansi).</p>
          </div>
          <RecordPaymentDialog clients={clients} invoices={invoices} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-border/60 shadow-sm md:col-span-1">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Banknote className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Payments Recorded</p>
                <h3 className="text-xl font-bold text-slate-800">{totalPayments}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm md:col-span-2">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Funds Received</p>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-800">{formatCurrency(totalValueReceived)}</h3>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400">Current Period</p>
                <p className="text-sm font-medium text-emerald-600">Realtime from database</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border p-4 md:p-6">
          {payments.length === 0 ? (
            <EmptyState
              title="Belum ada data payments"
              description="Belum ada pembayaran tercatat. Setelah finance merekam pembayaran, daftar payment akan muncul di sini."
            />
          ) : (
            <FilterablePaymentsTable payments={payments} clients={clients} invoices={invoices} />
          )}
        </div>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState
          title="Gagal memuat payments"
          description={error instanceof Error ? error.message : "Terjadi error saat membaca data payment dari database."}
        />
      </PageWrapper>
    );
  }
}
