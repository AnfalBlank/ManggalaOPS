import { format } from "date-fns";
import { Banknote, Filter, Search, Target, TrendingUp, Users } from "lucide-react";

import { CreateLeadDialog } from "@/components/forms/crud-dialogs";
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
import { getLeads } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientOptions } from "@/lib/options";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Won":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-none shadow-none">Won</Badge>;
    case "Lost":
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border-none shadow-none">Lost</Badge>;
    case "Negotiation":
    case "Follow Up":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border-none shadow-none">{status}</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-none shadow-none">{status}</Badge>;
  }
};

export default async function CRMPage() {
  try {
    const [leads, clients] = await Promise.all([getLeads(), getClientOptions()]);
    const totalLeads = leads.length;
    const wonLeads = leads.filter((lead) => lead.status === "Won").length;
    const openValue = leads
      .filter((lead) => lead.status !== "Won" && lead.status !== "Lost")
      .reduce((acc, curr) => acc + curr.estimatedValue, 0);
    const winRate = Math.round((wonLeads / totalLeads) * 100) || 0;

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Lead Management</h1>
            <p className="text-muted-foreground mt-1">Manage and track your prospect pipeline easily.</p>
          </div>
          <CreateLeadDialog clients={clients} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Leads</p>
                <h3 className="text-xl font-bold text-slate-800">{totalLeads}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Target className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Deals Won</p>
                <h3 className="text-xl font-bold text-slate-800">{wonLeads}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Banknote className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pipeline Value</p>
                <h3 className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(openValue).replace(',00', '')}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <TrendingUp className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Win Rate</p>
                <h3 className="text-xl font-bold text-slate-800">{winRate}%</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs opacity-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                placeholder="Search leads..."
                disabled
                className="flex h-9 w-full rounded-md border bg-muted/30 pl-9 pr-3 py-1 text-sm shadow-sm"
              />
            </div>
            <Button variant="outline" className="gap-2 shrink-0" disabled>
              <Filter className="size-4" /> Filter
            </Button>
          </div>

          {leads.length === 0 ? (
            <EmptyState
              title="Belum ada data leads"
              description="Database sudah tersambung, tapi tabel leads masih kosong. Jalankan seed atau mulai input data operasional." 
            />
          ) : (
            <div className="w-full overflow-x-auto pb-4 rounded-xl border">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px] rounded-tl-xl text-xs uppercase tracking-wider">Lead ID</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Client</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Contact</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Service Need</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider">Est. Value (IDR)</TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-right w-[100px] rounded-tr-xl text-xs uppercase tracking-wider">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                      <TableCell className="font-medium text-muted-foreground py-4">{lead.code}</TableCell>
                      <TableCell className="font-semibold text-foreground py-4">{lead.clientName}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm">{lead.contactPerson ?? "-"}</span>
                          <span className="text-xs text-muted-foreground">{lead.phone ?? "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm py-4 max-w-[200px] truncate" title={lead.serviceName}>
                        {lead.serviceName}
                      </TableCell>
                      <TableCell className="text-right font-medium py-4">{formatCurrency(lead.estimatedValue)}</TableCell>
                      <TableCell className="text-center py-4">{getStatusBadge(lead.status)}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm py-4">
                        {lead.createdAt ? format(new Date(lead.createdAt), "dd MMM yyyy") : "-"}
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
          title="Gagal memuat leads"
          description={error instanceof Error ? error.message : "Terjadi error saat membaca data leads dari database."}
        />
      </PageWrapper>
    );
  }
}
