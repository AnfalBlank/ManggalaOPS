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

// Label tampilan. Nilai tipe akun & keterangan jurnal di database tetap apa adanya.
const LABEL_TIPE_AKUN: Record<string, string> = {
  Asset: "Aset",
  Liability: "Kewajiban",
  Equity: "Modal",
  Revenue: "Pendapatan",
  Expense: "Beban",
};

export function labelTipeAkun(type: string | null | undefined) {
  if (!type) return "-";
  return LABEL_TIPE_AKUN[type] ?? type;
}

const nomor = (prefix: string, id: string) => `${prefix}-${id.padStart(4, "0")}`;

export function labelJurnal(description: string | null | undefined) {
  if (!description) return "-";
  const pola: [RegExp, (id: string) => string][] = [
    [/^Invoice issued #(\d+)$/, (id) => `Tagihan terbit ${nomor("INV", id)}`],
    [/^Invoice from quotation #(\d+)$/, (id) => `Tagihan dari penawaran ${nomor("QUO", id)}`],
    [/^Payment received for invoice #(\d+)$/, (id) => `Pembayaran masuk untuk ${nomor("INV", id)}`],
    [/^Expense recorded #(\d+)$/, (id) => `Pengeluaran ${nomor("EXP", id)}`],
  ];
  for (const [regex, ubah] of pola) {
    const cocok = description.match(regex);
    if (cocok) return ubah(cocok[1]);
  }
  if (description === "Opening Balance Setup") return "Saldo awal";
  return description;
}
