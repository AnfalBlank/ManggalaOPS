import { format } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle, CreditCard, Plus, Wallet } from "lucide-react";

import { RoleGuard } from "@/components/auth/guard";
import { CreateExpenseDialog, ExpenseRowActions } from "@/components/forms/expense-dialogs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFinanceOverviewData } from "@/lib/admin-data";
import { formatCurrency } from "@/lib/format";

export default async function FinancePage() {
  try {
    const data = await getFinanceOverviewData();

    return (
      <PageWrapper>
        <RoleGuard allow={["admin", "finance"]}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Finance</h1>
            <p className="text-muted-foreground mt-1">Track actual cash in (income) and cash out (expenses).</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" disabled>
              Export Report
            </Button>
            <CreateExpenseDialog />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <ArrowUpCircle className="size-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(data.totalIncome)}</div>
              <p className="text-xs text-muted-foreground mt-1">From recorded payments</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <div className="size-10 rounded-full bg-rose-50 flex items-center justify-center">
                <ArrowDownCircle className="size-5 text-rose-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">{formatCurrency(data.totalExpense)}</div>
              <p className="text-xs text-muted-foreground mt-1">Operational + project expenses</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-blue-50/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary">Net Cash Flow</CardTitle>
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="size-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(data.netCashFlow)}</div>
              <p className="text-xs text-muted-foreground mt-1">Current period</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground mb-4">Recent Expenses</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6 mb-8">
          {data.recentExpenses.length === 0 ? (
            <EmptyState title="Belum ada expense" description="Expense operasional akan muncul di sini setelah dicatat." />
          ) : (
            <div className="w-full overflow-x-auto pb-4 rounded-xl border">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px] rounded-tl-xl text-xs uppercase tracking-wider">Expense ID</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Category</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Description</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider">Amount (IDR)</TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-right w-[120px] rounded-tr-xl text-xs uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentExpenses.map((expense: { id: number; date: string; category: string; description: string; amount: number; status: string; projectId: number | null }) => (
                    <TableRow key={expense.id} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                      <TableCell className="font-medium text-muted-foreground py-4">EXP-{String(expense.id).padStart(4, "0")}</TableCell>
                      <TableCell className="text-sm py-4">{format(new Date(expense.date), "dd MMM yyyy")}</TableCell>
                      <TableCell className="py-4 font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4 text-muted-foreground" />
                          {expense.category}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm py-4 max-w-[250px] truncate" title={expense.description}>{expense.description}</TableCell>
                      <TableCell className="text-right font-medium py-4 text-foreground">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="text-center py-4"><Badge>{expense.status}</Badge></TableCell>
                      <TableCell className="text-right py-4"><ExpenseRowActions expense={expense} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        </RoleGuard>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat finance" description={error instanceof Error ? error.message : "Terjadi error saat memuat finance overview."} />
      </PageWrapper>
    );
  }
}
