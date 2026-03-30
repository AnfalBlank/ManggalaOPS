"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle, CreditCard, Wallet } from "lucide-react";

import { ClickableStatCard } from "@/components/cards/clickable-stat-card";
import { ExpenseRowActions } from "@/components/forms/expense-dialogs";
import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { isWithinPeriod, type FilterPeriod } from "@/lib/view-filters";

const expenseTypeOptions = [
  { label: "Semua kategori", value: "all" },
  { label: "Operational", value: "Operational" },
  { label: "Project", value: "Project" },
  { label: "Marketing", value: "Marketing" },
  { label: "Office", value: "Office" },
];

type ExpenseRow = { id: number; date: Date; category: string; description: string; amount: number; taxMode?: string | null; taxPercent?: number | null; taxAmount?: number | null; baseAmount?: number | null; status: string | null; projectId: number | null; paymentAccountCode?: string | null; paymentAccountName?: string | null };

export function FinanceOverview({
  totalIncome,
  totalExpense,
  netCashFlow,
  recentExpenses,
  filters,
}: {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  recentExpenses: ExpenseRow[];
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

  const filteredExpenses = useMemo(
    () => recentExpenses.filter((expense) => {
      const matchesQuery = `${expense.category} ${expense.description} ${expense.status ?? ""}`.toLowerCase().includes(query.toLowerCase());
      const matchesPeriod = isWithinPeriod(expense.date, period);
      const matchesType = type === "all" || expense.category === type;
      return matchesQuery && matchesPeriod && matchesType;
    }),
    [period, query, recentExpenses, type],
  );

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <ClickableStatCard href="/finance?type=income" title="Total Income" value={formatCurrency(totalIncome)} hint="Dari payment tercatat" icon={<ArrowUpCircle className="size-5" />} accentClassName="bg-emerald-50 text-emerald-600" />
        <ClickableStatCard href="/finance?type=Operational" title="Total Expenses" value={formatCurrency(totalExpense)} hint="Expense operasional" icon={<ArrowDownCircle className="size-5" />} accentClassName="bg-rose-50 text-rose-600" />
        <ClickableStatCard href="/finance?period=month" title="Net Cash Flow" value={formatCurrency(netCashFlow)} hint="Arus kas periode aktif" icon={<Wallet className="size-5" />} accentClassName="bg-primary/10 text-primary" featured />
      </div>

      <h2 className="text-xl font-bold tracking-tight text-foreground mb-4">Recent Expenses</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6 mb-8">
        <TableFilterBar
          value={query}
          onChange={setQuery}
          placeholder="Search expenses..."
          periodValue={period}
          onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
          typeValue={type}
          onTypeChange={setType}
          typeOptions={expenseTypeOptions}
        />

        <div className="w-full overflow-x-auto pb-4 rounded-xl border mt-4">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px] rounded-tl-xl text-xs uppercase tracking-wider">Expense ID</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Category</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Description</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">Amount (IDR)</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Akun Bayar</TableHead>
                <TableHead className="text-center text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right w-[120px] rounded-tr-xl text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                  <TableCell className="font-medium text-muted-foreground py-4">EXP-{String(expense.id).padStart(4, "0")}</TableCell>
                  <TableCell className="text-sm py-4">{format(new Date(expense.date), "dd MMM yyyy")}</TableCell>
                  <TableCell className="py-4 font-medium text-slate-700"><div className="flex items-center gap-2"><CreditCard className="size-4 text-muted-foreground" />{expense.category}</div></TableCell>
                  <TableCell className="text-sm py-4 max-w-[250px] truncate" title={expense.description}>{expense.description}</TableCell>
                  <TableCell className="text-right font-medium py-4 text-foreground">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell className="py-4 text-sm">{expense.paymentAccountName ?? expense.paymentAccountCode ?? "-"}</TableCell>
                  <TableCell className="text-center py-4"><Badge>{expense.status}</Badge></TableCell>
                  <TableCell className="text-right py-4"><ExpenseRowActions expense={expense} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
