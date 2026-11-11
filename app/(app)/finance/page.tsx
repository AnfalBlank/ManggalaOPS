import { RoleGuard } from "@/components/auth/guard";
import { CreateExpenseDialog } from "@/components/forms/expense-dialogs";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { RingkasanKeuangan } from "@/components/finance/ringkasan-keuangan";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { FinanceExportButton } from "@/components/reports/finance-export-button";
import { ErrorState } from "@/components/ui/state";
import { getFinanceOverviewData } from "@/lib/admin-data";
import { labelKategori } from "@/lib/expense-categories";
import { labelStatus } from "@/lib/label-status";
import { bacaPeriode, getRingkasanKeuangan } from "@/lib/ringkasan-keuangan";

export default async function FinancePage({ searchParams }: { searchParams?: Promise<{ q?: string; period?: string; type?: string; periode?: string }> }) {
  try {
    const params = (await searchParams) ?? {};
    const [data, ringkasan] = await Promise.all([getFinanceOverviewData(), getRingkasanKeuangan(bacaPeriode(params.periode))]);

    return (
      <PageWrapper>
        <RoleGuard allow={["admin", "finance"]}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Keuangan</h1>
              <p className="text-muted-foreground mt-1">Uang masuk dari klien, uang keluar buat biaya, dan tagihan yang belum dibayar.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FinanceExportButton rows={data.recentExpenses.map((expense) => ({ date: new Date(expense.date).toISOString().slice(0, 10), category: labelKategori(expense.category), description: expense.description, amount: expense.amount, status: labelStatus(expense.status) }))} />
              <CreateExpenseDialog paymentAccounts={data.paymentAccounts} projects={data.projects} poKlien={data.poKlien} poSupplier={data.poSupplier} />
            </div>
          </div>

          <RingkasanKeuangan data={ringkasan} />

          <FinanceOverview
            recentExpenses={data.recentExpenses}
            paymentAccounts={data.paymentAccounts}
            projects={data.projects}
            poKlien={data.poKlien}
            poSupplier={data.poSupplier}
            filters={{ initialQuery: params.q, initialPeriod: (params.period as "all" | "30d" | "month" | "year") ?? "all", initialType: params.type ?? "all" }}
          />
        </RoleGuard>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat halaman Keuangan" description={error instanceof Error ? error.message : "Ada error saat memuat data keuangan."} />
      </PageWrapper>
    );
  }
}
