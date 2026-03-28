import { CheckCircle, Clock, FileSignature, FileX, Plus } from "lucide-react";

import { PageWrapper } from "@/components/layout/page-wrapper";
import { QuotationActionsTable } from "@/components/quotations/quotation-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/state";
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
            <QuotationActionsTable quotations={quotations} />
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
