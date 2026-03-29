"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { BookOpen, ReceiptText, Scale } from "lucide-react";

import { LedgerExportButton } from "@/components/accounting/accounting-export-buttons";

import { ClickableStatCard } from "@/components/cards/clickable-stat-card";
import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { isWithinPeriod, type FilterPeriod } from "@/lib/view-filters";

const accountTypeOptions = [
  { label: "Semua akun", value: "all" },
  { label: "Asset", value: "Asset" },
  { label: "Liability", value: "Liability" },
  { label: "Equity", value: "Equity" },
  { label: "Revenue", value: "Revenue" },
  { label: "Expense", value: "Expense" },
];

type AccountRow = { code: string; name: string; type: string; balance: number };
type JournalEntryRow = { id: number; date: Date; description: string; accountCode: string; accountName?: string | null; debit: number | null; credit: number | null };

export function AccountingOverview({
  accounts,
  entries,
  filters,
}: {
  accounts: AccountRow[];
  entries: JournalEntryRow[];
  filters?: { initialQuery?: string; initialPeriod?: FilterPeriod; initialType?: string };
}) {
  const [query, setQuery] = useState(filters?.initialQuery ?? "");
  const [period, setPeriod] = useState<FilterPeriod>(filters?.initialPeriod ?? "all");
  const [type, setType] = useState(filters?.initialType ?? "all");

  useEffect(() => {
    setQuery(filters?.initialQuery ?? "");
    setPeriod(filters?.initialPeriod ?? "all");
    setType(filters?.initialType ?? "all");
  }, [filters?.initialPeriod, filters?.initialQuery, filters?.initialType]);

  const filteredAccounts = useMemo(
    () => accounts.filter((account) => {
      const matchesQuery = `${account.code} ${account.name} ${account.type}`.toLowerCase().includes(query.toLowerCase());
      const matchesType = type === "all" || account.type === type;
      return matchesQuery && matchesType;
    }),
    [accounts, query, type],
  );

  const filteredEntries = useMemo(
    () => entries.filter((entry) => {
      const matchesQuery = `${entry.description} ${entry.accountCode} ${entry.accountName ?? ""}`.toLowerCase().includes(query.toLowerCase());
      const matchesPeriod = isWithinPeriod(entry.date, period);
      return matchesQuery && matchesPeriod;
    }),
    [entries, period, query],
  );

  const grouped = filteredEntries.reduce<Record<string, JournalEntryRow[]>>((acc, entry) => {
    const key = String(entry.id);
    acc[key] ??= [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <ClickableStatCard href="/accounting" title="Chart of Accounts" value={accounts.length} hint="Lihat semua akun" icon={<BookOpen className="size-5" />} accentClassName="bg-blue-50 text-blue-600" />
        <ClickableStatCard href="/accounting?period=month" title="General Journal" value={Object.keys(grouped).length} hint="Jurnal periode aktif" icon={<ReceiptText className="size-5" />} accentClassName="bg-emerald-50 text-emerald-600" />
        <ClickableStatCard href="/accounting?type=Revenue" title="Revenue Accounts" value={accounts.filter((account) => account.type === "Revenue").length} hint="Filter akun revenue" icon={<Scale className="size-5" />} accentClassName="bg-purple-50 text-purple-600" />
      </div>

      <div className="mb-6">
        <TableFilterBar
          value={query}
          onChange={setQuery}
          placeholder="Search accounts or journals..."
          periodValue={period}
          onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
          typeValue={type}
          onTypeChange={setType}
          typeOptions={accountTypeOptions}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6 flex flex-col h-full">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"><BookOpen className="size-5 text-primary" /> Chart of Accounts</h2>
          <div className="overflow-y-auto pr-2" style={{ maxHeight: "500px" }}>
            <div className="flex flex-col gap-3">
              {filteredAccounts.map((account) => (
                <div key={account.code} className="p-3 rounded-lg border border-border/50 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary">{account.code} - {account.name}</span>
                    <span className="text-xs text-muted-foreground">{account.type}</span>
                  </div>
                  <div className="text-right"><span className="text-sm font-medium text-foreground">{formatCurrency(account.balance ?? 0)}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-3 mb-4"><h2 className="text-lg font-bold tracking-tight text-foreground">General Journal</h2><LedgerExportButton entries={filteredEntries.map((entry) => ({ date: format(new Date(entry.date), "yyyy-MM-dd"), description: entry.description, accountCode: `${entry.accountCode} - ${entry.accountName ?? '-'}`, debit: entry.debit ?? 0, credit: entry.credit ?? 0 }))} /></div>
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
                  {Object.entries(grouped).map(([journalId, journalEntries]) => (
                    <Fragment key={`journal-group-${journalId}`}>
                      <TableRow className="bg-muted/10 border-b-0 hover:bg-muted/10">
                        <TableCell colSpan={4} className="py-2 text-xs font-medium text-muted-foreground bg-muted/20">JRN-{journalId} - {journalEntries[0]?.description}</TableCell>
                      </TableRow>
                      {journalEntries.map((entry, index) => (
                        <TableRow key={`${journalId}-${index}`} className="border-b-0 hover:bg-transparent">
                          <TableCell className="py-2 align-top text-xs text-muted-foreground w-[100px]">{index === 0 ? format(new Date(entry.date), "dd/MM/yy") : ""}</TableCell>
                          <TableCell className="py-2 text-sm">{entry.accountCode} - {entry.accountName ?? '-'}</TableCell>
                          <TableCell className="text-right py-2 font-medium">{entry.debit ? formatCurrency(entry.debit) : ""}</TableCell>
                          <TableCell className="text-right py-2 font-medium">{entry.credit ? formatCurrency(entry.credit) : ""}</TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
