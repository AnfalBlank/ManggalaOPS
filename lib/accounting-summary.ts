type AccountRow = { code: string; name: string; type: string; balance: number };

type Mapping = {
  cash: string;
  bankMandiri: string;
  bankBca: string;
  receivable: string;
  fixedAsset: string;
  liability: string;
  equity: string;
  projectRevenue: string;
  nonProjectRevenue: string;
  operationalExpense: string;
  projectExpense: string;
};

export function buildFinancialSummary(accounts: AccountRow[], mapping: Mapping) {
  const getBalance = (code: string) => accounts.find((account) => account.code === code)?.balance ?? 0;
  const revenueAccounts = accounts.filter((account) => account.type === "Revenue");
  const expenseAccounts = accounts.filter((account) => account.type === "Expense");
  const assetAccounts = accounts.filter((account) => account.type === "Asset");
  const liabilityAccounts = accounts.filter((account) => account.type === "Liability");
  const equityAccounts = accounts.filter((account) => account.type === "Equity");

  const totalRevenue = revenueAccounts.reduce((sum, account) => sum + Math.abs(account.balance ?? 0), 0);
  const totalExpense = expenseAccounts.reduce((sum, account) => sum + Math.max(account.balance ?? 0, 0), 0);
  const totalAssets = assetAccounts.reduce((sum, account) => sum + (account.balance ?? 0), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, account) => sum + Math.abs(account.balance ?? 0), 0);
  const totalEquity = equityAccounts.reduce((sum, account) => sum + Math.abs(account.balance ?? 0), 0);

  return {
    totalRevenue,
    totalExpense,
    netProfit: totalRevenue - totalExpense,
    totalAssets,
    totalLiabilities,
    totalEquityProxy: totalEquity + (totalRevenue - totalExpense),
    cashOnHand: getBalance(mapping.cash),
    bankBalance: getBalance(mapping.bankMandiri) + getBalance(mapping.bankBca),
    receivables: getBalance(mapping.receivable),
  };
}
