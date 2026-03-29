import { RoleGuard } from "@/components/auth/guard";
import { CreateExpenseDialog } from "@/components/forms/expense-dialogs";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { FinanceExportButton } from "@/components/reports/finance-export-button";
import { ErrorState } from "@/components/ui/state";
import { getFinanceOverviewData } from "@/lib/admin-data";

export default async function FinancePage({ searchParams }: { searchParams?: Promise<{ q?: string; period?: string; type?: string }> }) {
  try {
    const params = (await searchParams) ?? {};
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
              <FinanceExportButton rows={data.recentExpenses.map((expense) => ({ date: new Date(expense.date).toISOString().slice(0, 10), category: expense.category, description: expense.description, amount: expense.amount, status: expense.status ?? "-" }))} />
              <CreateExpenseDialog paymentAccounts={data.paymentAccounts} projects={data.projects} />
            </div>
          </div>

          <FinanceOverview
            totalIncome={data.totalIncome}
            totalExpense={data.totalExpense}
            netCashFlow={data.netCashFlow}
            recentExpenses={data.recentExpenses}
            filters={{ initialQuery: params.q, initialPeriod: (params.period as "all" | "30d" | "month" | "year") ?? "all", initialType: params.type ?? "all" }}
          />
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
