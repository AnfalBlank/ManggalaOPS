import { AlertCircle, Banknote, FileCheck, Landmark } from "lucide-react";

import { InvoiceDialog } from "@/components/forms/invoice-dialogs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { FilterableInvoicesTable } from "@/components/tables/filterable-lists";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getInvoices } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientOptions } from "@/lib/options";
import type { InvoiceListItem } from "@/lib/types";

export default async function InvoicesPage() {
  try {
    const [invoiceRows, clients] = await Promise.all([getInvoices(), getClientOptions()]);
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
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <FileCheck className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Invoices</p>
                <h3 className="text-xl font-bold text-slate-800">{totalInvoices}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Landmark className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Value Issued</p>
                <h3 className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(totalValue).replace(',00', '')}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Banknote className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Paid</p>
                <h3 className="text-lg md:text-xl font-bold text-emerald-600">{formatCurrency(totalPaid).replace(',00', '')}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="size-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Outstanding</p>
                <h3 className="text-lg md:text-xl font-bold text-rose-600">{formatCurrency(unpaidValue).replace(',00', '')}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border p-4 md:p-6">
          {invoices.length === 0 ? (
            <EmptyState
              title="Belum ada data invoices"
              description="Belum ada invoice yang diterbitkan. Setelah sales atau finance membuat invoice, datanya akan tampil di sini."
            />
          ) : (
            <FilterableInvoicesTable invoices={invoices} clients={clients} />
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
