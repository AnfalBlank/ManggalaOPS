import { format } from "date-fns";
import { CheckCircle, Clock, Download, FileSignature, FileX, Plus } from "lucide-react";

import { PageWrapper } from "@/components/layout/page-wrapper";
import { Badge } from "@/components/ui/badge";
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
import { getQuotations } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default async function QuotationsPage() {
  try {
    const quotations = await getQuotations();
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
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2 shadow-sm" disabled>
            <Plus className="size-4" /> Create Quotation
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <FileSignature className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Quotes</p>
                <h3 className="text-xl font-bold text-slate-800">{totalQuotations}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Accepted</p>
                <h3 className="text-xl font-bold text-slate-800">{acceptedQuotations}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Value</p>
                <h3 className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(pendingValue).replace(',00', '')}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <FileX className="size-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Rejected</p>
                <h3 className="text-xl font-bold text-slate-800">{rejectedQuotations}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border p-4 md:p-6">
          {quotations.length === 0 ? (
            <EmptyState
              title="Belum ada data quotations"
              description="Tabel quotations masih kosong. Setelah tim sales bikin penawaran atau seed dijalankan, datanya akan muncul di sini."
            />
          ) : (
            <div className="w-full overflow-x-auto pb-4 rounded-xl border">
              <Table className="min-w-[900px]">
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[120px] text-xs uppercase tracking-wider font-semibold">Quote ID</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">Client & Project</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">Dates</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Total Amount</TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                    <TableHead className="text-right w-[100px] text-xs uppercase tracking-wider font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quote) => (
                    <TableRow key={quote.id} className="group hover:bg-slate-50/50 transition-colors border-b last:border-0">
                      <TableCell className="font-medium text-slate-500 py-4">{quote.code}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-800">{quote.clientName}</span>
                          <span className="text-xs text-slate-500 line-clamp-1">{quote.projectName ?? "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-4 text-slate-500">
                        <div className="flex flex-col gap-1">
                          <span>Date: {quote.date ? format(new Date(quote.date), "dd MMM yyyy") : "-"}</span>
                          <span>Valid: {quote.validUntil ? format(new Date(quote.validUntil), "dd MMM yyyy") : "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold py-4 text-slate-700">{formatCurrency(quote.total)}</TableCell>
                      <TableCell className="text-center py-4">
                        {quote.status === "Accepted" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Accepted</Badge>
                        ) : quote.status === "Sent" ? (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Sent</Badge>
                        ) : quote.status === "Rejected" ? (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">Rejected</Badge>
                        ) : (
                          <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200 border-none">{quote.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 px-0 text-slate-400 rounded-full bg-white shadow-sm border-slate-200"
                            disabled
                            title="Download PDF"
                          >
                            <Download className="size-4" />
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
          title="Gagal memuat quotations"
          description={error instanceof Error ? error.message : "Terjadi error saat membaca data quotation dari database."}
        />
      </PageWrapper>
    );
  }
}
