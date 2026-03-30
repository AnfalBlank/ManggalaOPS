import { RoleGuard } from "@/components/auth/guard";
import { AccountingDetailedReports } from "@/components/accounting/accounting-detailed-reports";
import { ExecutiveFinancialReport } from "@/components/accounting/executive-financial-report";
import { AccountingFinancialReport } from "@/components/accounting/accounting-financial-report";
import { AccountingOverview } from "@/components/accounting/accounting-overview";
import { AccountingTaxReport } from "@/components/accounting/accounting-tax-report";
import { OpeningBalancePanel } from "@/components/accounting/opening-balance-panel";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ErrorState } from "@/components/ui/state";
import { getAccountingOverviewData } from "@/lib/admin-data";
import { buildFinancialSummary } from "@/lib/accounting-summary";
import { getAccountMapping } from "@/lib/account-mapping";
import { getExpenses, getInvoices } from "@/lib/data";
import { getOpeningBalance } from "@/lib/opening-balance";

export default async function AccountingPage({ searchParams }: { searchParams?: Promise<{ q?: string; period?: string; type?: string }> }) {
  try {
    const params = (await searchParams) ?? {};
    const [data, invoices, expenses, openingBalance, mapping] = await Promise.all([getAccountingOverviewData(), getInvoices(), getExpenses(), getOpeningBalance(), getAccountMapping()]);

    const taxRows = [
      ...invoices.map((invoice) => ({ date: invoice.date ?? "", source: invoice.code, client: invoice.clientName, dpp: invoice.subtotal, ppn: invoice.tax, total: invoice.total, type: "PPN Keluaran" as const })),
      ...expenses
        .filter((expense) => (expense.taxAmount ?? 0) > 0)
        .map((expense) => ({ date: expense.date ?? "", source: `EXP-${String(expense.id).padStart(4, "0")}`, client: expense.description, dpp: expense.baseAmount ?? expense.amount, ppn: expense.taxAmount ?? 0, total: expense.amount, type: "PPN Masukan" as const })),
    ].filter((row) => row.date);

    const financialSummary = buildFinancialSummary(data.accounts, mapping);

    return (
      <PageWrapper>
        <RoleGuard allow={["admin", "finance"]}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Accounting System</h1>
              <p className="text-muted-foreground mt-1">General Ledger, Journals, and Chart of Accounts.</p>
            </div>
            <div className="flex gap-2" />
          </div>

          <OpeningBalancePanel initial={openingBalance} mapping={mapping} />
          <ExecutiveFinancialReport accounts={data.accounts} />
          <AccountingFinancialReport summary={financialSummary} periodLabel="Sampai periode aktif" />
          <AccountingDetailedReports accounts={data.accounts} />
          <AccountingOverview
            accounts={data.accounts}
            entries={data.entries as { id: number; date: Date; description: string; accountCode: string; debit: number | null; credit: number | null }[]}
            filters={{ initialQuery: params.q, initialPeriod: (params.period as "all" | "30d" | "month" | "year") ?? "all", initialType: params.type ?? "all" }}
          />
          <AccountingTaxReport rows={taxRows} />
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
