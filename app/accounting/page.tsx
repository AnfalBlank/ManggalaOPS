import { Fragment } from "react";
import { format } from "date-fns";
import { BookOpen, FileSpreadsheet, Plus } from "lucide-react";

import { RoleGuard } from "@/components/auth/guard";
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
import { getAccountingOverviewData } from "@/lib/admin-data";
import { formatCurrency } from "@/lib/format";

export default async function AccountingPage() {
  try {
    const data = await getAccountingOverviewData();
    type JournalEntryRow = {
      id: number;
      date: Date;
      description: string;
      accountCode: string;
      debit: number | null;
      credit: number | null;
    };

    const grouped = (data.entries as JournalEntryRow[]).reduce<Record<string, JournalEntryRow[]>>((acc, entry) => {
      const key = String(entry.id);
      acc[key] ??= [];
      acc[key].push(entry);
      return acc;
    }, {});

    return (
      <PageWrapper>
        <RoleGuard allow={["admin", "finance"]}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Accounting System</h1>
            <p className="text-muted-foreground mt-1">General Ledger, Journals, and Chart of Accounts.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" disabled>
              <FileSpreadsheet className="size-4" /> Export Ledger
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2" disabled>
              <Plus className="size-4" /> Manual Journal
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6 flex flex-col h-full">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mb-4">
              <BookOpen className="size-5 text-primary" /> Chart of Accounts
            </h2>
            <div className="overflow-y-auto pr-2" style={{ maxHeight: "500px" }}>
              <div className="flex flex-col gap-3">
                {data.accounts.map((account: { code: string; name: string; type: string; balance: number }) => (
                  <div key={account.code} className="p-3 rounded-lg border border-border/50 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-primary">{account.code} - {account.name}</span>
                      <span className="text-xs text-muted-foreground">{account.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">{formatCurrency(account.balance ?? 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
            <h2 className="text-lg font-bold tracking-tight text-foreground mb-4">General Journal</h2>
            {Object.keys(grouped).length === 0 ? (
              <EmptyState title="Belum ada jurnal" description="Jurnal otomatis akan muncul dari transaksi payment dan finance." />
            ) : (
              <div className="w-full overflow-x-auto pb-4 rounded-xl border">
                <Table className="min-w-[600px]">
                  <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[100px] text-xs uppercase tracking-wider">Date</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-left">Account</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wider">Debit</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wider">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(grouped).map(([journalId, entries]) => (
                      <Fragment key={`journal-group-${journalId}`}>
                        <TableRow className="bg-muted/10 border-b-0 hover:bg-muted/10">
                          <TableCell colSpan={4} className="py-2 text-xs font-medium text-muted-foreground bg-muted/20">
                            JRN-{journalId} - {entries[0]?.description}
                          </TableCell>
                        </TableRow>
                        {entries.map((entry, index) => (
                          <TableRow key={`${journalId}-${index}`} className="border-b-0 hover:bg-transparent">
                            <TableCell className="py-2 align-top text-xs text-muted-foreground w-[100px]">
                              {index === 0 ? format(new Date(entry.date), "dd/MM/yy") : ""}
                            </TableCell>
                            <TableCell className="py-2 text-sm">{entry.accountCode}</TableCell>
                            <TableCell className="text-right py-2 font-medium">{entry.debit ? formatCurrency(entry.debit) : ""}</TableCell>
                            <TableCell className="text-right py-2 font-medium">{entry.credit ? formatCurrency(entry.credit) : ""}</TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
        </RoleGuard>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat accounting" description={error instanceof Error ? error.message : "Terjadi error saat memuat accounting overview."} />
      </PageWrapper>
    );
  }
}
