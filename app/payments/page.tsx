import { format } from "date-fns";
import { Banknote, ListPlus, Receipt, ShieldCheck } from "lucide-react";

import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
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
import { getPayments } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { generateKwitansiPDF } from "@/lib/pdf";

export default async function PaymentsPage() {
  try {
    const payments = await getPayments();
    const totalPayments = payments.length;
    const totalValueReceived = payments.reduce((acc, curr) => acc + curr.amount, 0);

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Payments</h1>
            <p className="text-muted-foreground mt-1">Track incoming payments and generate official receipts (Kwitansi).</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2 shadow-sm" disabled>
            <ListPlus className="size-4" /> Record Payment
          </Button>
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
            <div className="w-full overflow-x-auto pb-4 rounded-xl border">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[120px] text-xs uppercase tracking-wider font-semibold">Payment ID</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">Client</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">Related Invoice</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">Method</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Amount Reflected</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Date</TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider font-semibold">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="group hover:bg-slate-50/50 transition-colors border-b last:border-0">
                      <TableCell className="font-medium text-slate-500 py-4">{payment.code}</TableCell>
                      <TableCell className="py-4">
                        <span className="font-semibold text-slate-800">{payment.clientName}</span>
                      </TableCell>
                      <TableCell className="py-4 text-xs font-medium text-blue-600 hover:underline cursor-pointer">{payment.invoiceCode}</TableCell>
                      <TableCell className="text-sm py-4 text-slate-600">{payment.paymentMethod ?? "-"}</TableCell>
                      <TableCell className="text-right font-bold py-4 text-emerald-600">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="text-right text-sm py-4 text-slate-500">
                        {payment.date ? format(new Date(payment.date), "dd MMM yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 px-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full border-emerald-200"
                            onClick={() =>
                              generateKwitansiPDF({
                                id: payment.code,
                                client: payment.clientName,
                                amount: payment.amount,
                                description: `Pembayaran Invoice ${payment.invoiceCode}`,
                              })
                            }
                            title="Download Kwitansi"
                          >
                            <Receipt className="size-4" />
                          </Button>
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
          title="Gagal memuat payments"
          description={error instanceof Error ? error.message : "Terjadi error saat membaca data payment dari database."}
        />
      </PageWrapper>
    );
  }
}
