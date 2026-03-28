import { format } from "date-fns";
import { AlertCircle, Banknote, FileCheck, Landmark } from "lucide-react";

import { CreateInvoiceDialog } from "@/components/forms/crud-dialogs";
import { DownloadInvoiceButton } from "@/components/pdf/download-invoice-button";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInvoices } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientOptions } from "@/lib/options";

function StatusBadge({ status }: { status: string }) {
  if (status === "Paid") {
    return <Badge className="bg-emerald-100 text-emerald-700 border-none">Paid</Badge>;
  }
  if (status === "Partially Paid") {
    return <Badge className="bg-amber-100 text-amber-700 border-none">Partial</Badge>;
  }
  if (status === "Overdue") {
    return <Badge className="bg-rose-100 text-rose-700 border-none">Overdue</Badge>;
  }
  return <Badge className="bg-slate-200 text-slate-700 border-none">Unpaid</Badge>;
}

export default async function InvoicesPage() {
  try {
    const [invoices, clients] = await Promise.all([getInvoices(), getClientOptions()]);
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
          <CreateInvoiceDialog clients={clients} />
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
            <div className="w-full overflow-x-auto pb-4 rounded-xl border">
              <Table className="min-w-[900px]">
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[120px] text-xs uppercase tracking-wider font-semibold">Invoice ID</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">Client & Project</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">Dates</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Amount Paid</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Total Amount</TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                    <TableHead className="text-right w-[100px] text-xs uppercase tracking-wider font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="group hover:bg-slate-50/50 transition-colors border-b last:border-0">
                      <TableCell className="font-medium text-slate-500 py-4">{invoice.code}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-800">{invoice.clientName}</span>
                          <span className="text-xs text-slate-500 line-clamp-1">{invoice.projectName ?? "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-4 text-slate-500">
                        <div className="flex flex-col gap-1">
                          <span>Iss: {invoice.date ? format(new Date(invoice.date), "dd MMM yyyy") : "-"}</span>
                          <span className={invoice.status === "Overdue" ? "text-rose-600 font-medium" : ""}>
                            Due: {invoice.dueDate ? format(new Date(invoice.dueDate), "dd MMM yyyy") : "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium py-4 text-slate-500">
                        {invoice.amountPaid > 0 ? formatCurrency(invoice.amountPaid) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold py-4 text-slate-800">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell className="text-center py-4">
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex items-center justify-end">
                          <DownloadInvoiceButton
                            payload={{
                              id: invoice.code,
                              client: invoice.clientName,
                              project: invoice.projectName ?? "-",
                              date: invoice.date ?? new Date().toISOString(),
                              dueDate: invoice.dueDate ?? new Date().toISOString(),
                              subtotal: invoice.subtotal,
                              ppn: invoice.tax,
                              total: invoice.total,
                              amountPaid: invoice.amountPaid,
                              status: invoice.status,
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
