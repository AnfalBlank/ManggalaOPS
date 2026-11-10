"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";

import { ExpenseRowActions } from "@/components/forms/expense-dialogs";
import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { expenseCategoryOptions, labelKategori } from "@/lib/expense-categories";
import { labelStatus } from "@/lib/label-status";
import { isWithinPeriod, type FilterPeriod } from "@/lib/view-filters";

const expenseTypeOptions = [
  { label: "Semua kategori", value: "all" },
  ...expenseCategoryOptions.map((item) => ({ label: labelKategori(item), value: item })),
];

type ExpenseRow = { id: number; date: Date; category: string; description: string; amount: number; taxMode?: string | null; taxPercent?: number | null; taxAmount?: number | null; baseAmount?: number | null; status: string | null; projectId: number | null; paymentAccountCode?: string | null; paymentAccountName?: string | null };
type ProjectOption = { id: number; name: string; clientId?: number; clientName?: string };
type PaymentAccount = { code: string; name: string; balance: number };

function tanggal(value: Date) {
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function FinanceOverview({
  recentExpenses,
  paymentAccounts = [],
  projects = [],
  filters,
}: {
  recentExpenses: ExpenseRow[];
  paymentAccounts?: PaymentAccount[];
  projects?: ProjectOption[];
  filters?: { initialQuery?: string; initialPeriod?: FilterPeriod; initialType?: string };
}) {
  const [query, setQuery] = useState(filters?.initialQuery ?? "");
  const [period, setPeriod] = useState<FilterPeriod>(filters?.initialPeriod ?? "all");
  const [type, setType] = useState(filters?.initialType ?? "all");
  const [range, setRange] = useState({ start: "", end: "" });

  useEffect(() => {
    setQuery(filters?.initialQuery ?? "");
    setPeriod(filters?.initialPeriod ?? "all");
    setType(filters?.initialType ?? "all");
  }, [filters?.initialPeriod, filters?.initialQuery, filters?.initialType]);

  const filteredExpenses = useMemo(
    () => recentExpenses.filter((expense) => {
      const matchesQuery = `${expense.category} ${labelKategori(expense.category)} ${expense.description} ${labelStatus(expense.status)}`.toLowerCase().includes(query.toLowerCase());
      const matchesPeriod = isWithinPeriod(expense.date, period, range);
      const matchesType = type === "all" || expense.category === type;
      return matchesQuery && matchesPeriod && matchesType;
    }),
    [period, query, recentExpenses, type, range],
  );
  const totalTersaring = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <>
      <div className="flex flex-col gap-1 mb-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Daftar pengeluaran</h2>
        <p className="text-sm text-muted-foreground">{filteredExpenses.length} pengeluaran · total {formatCurrency(totalTersaring)}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6 mb-8">
        <TableFilterBar
          value={query}
          onChange={setQuery}
          placeholder="Cari pengeluaran..."
          periodValue={period}
          onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
          typeValue={type}
          onTypeChange={setType}
          typeOptions={expenseTypeOptions}
          customStart={range.start}
          customEnd={range.end}
          onCustomRangeChange={setRange}
        />

        <div className="w-full overflow-x-auto pb-4 rounded-xl border mt-4 max-md:border-0 max-md:pb-0">
          <Table className="min-w-[1050px] xl:min-w-0">
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px] rounded-tl-xl text-xs uppercase tracking-wider">No.</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Tanggal</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Kategori</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Keterangan</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">DPP</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">PPN</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">Total (Rp)</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Dibayar dari</TableHead>
                <TableHead className="text-center text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right w-[120px] rounded-tr-xl text-xs uppercase tracking-wider">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">Belum ada pengeluaran yang cocok dengan filter.</TableCell>
                </TableRow>
              ) : filteredExpenses.map((expense) => (
                <TableRow key={expense.id} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                  <TableCell className="font-medium text-muted-foreground py-4">EXP-{String(expense.id).padStart(4, "0")}</TableCell>
                  <TableCell className="text-sm py-4">{tanggal(expense.date)}</TableCell>
                  <TableCell className="py-4 font-medium text-slate-700"><div className="flex items-center gap-2"><CreditCard className="size-4 text-muted-foreground" />{labelKategori(expense.category)}</div></TableCell>
                  <TableCell className="text-sm py-4 max-w-[250px] truncate" title={expense.description}>{expense.description}</TableCell>
                  <TableCell className="text-right py-4 text-foreground">{formatCurrency(expense.baseAmount ?? expense.amount)}</TableCell>
                  <TableCell className="text-right py-4 text-foreground">{formatCurrency(expense.taxAmount ?? 0)}</TableCell>
                  <TableCell className="text-right font-medium py-4 text-foreground">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell className="py-4 text-sm">{expense.paymentAccountName ?? expense.paymentAccountCode ?? "-"}</TableCell>
                  <TableCell className="text-center py-4"><Badge>{labelStatus(expense.status)}</Badge></TableCell>
                  <TableCell className="text-right py-4"><ExpenseRowActions expense={expense} paymentAccounts={paymentAccounts} projects={projects} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
