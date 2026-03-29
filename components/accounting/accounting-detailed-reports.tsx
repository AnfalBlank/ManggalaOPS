"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type AccountRow = { code: string; name: string; type: string; balance: number };

export function AccountingDetailedReports({ accounts }: { accounts: AccountRow[] }) {
  const assets = accounts.filter((account) => account.type === "Asset");
  const liabilities = accounts.filter((account) => account.type === "Liability");
  const equities = accounts.filter((account) => account.type === "Equity");
  const revenues = accounts.filter((account) => account.type === "Revenue");
  const expenses = accounts.filter((account) => account.type === "Expense");

  const totalRevenue = revenues.reduce((sum, account) => sum + Math.abs(account.balance), 0);
  const totalExpense = expenses.reduce((sum, account) => sum + Math.abs(account.balance), 0);
  const totalAssets = assets.reduce((sum, account) => sum + account.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, account) => sum + Math.abs(account.balance), 0);
  const totalEquity = equities.reduce((sum, account) => sum + Math.abs(account.balance), 0) + (totalRevenue - totalExpense);

  const renderGroup = (title: string, rows: AccountRow[], sign: "plain" | "abs" = "plain") => (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">{title}</h3>
        <div className="space-y-2 text-sm">
          {rows.map((row) => <div key={row.code} className="flex justify-between gap-3"><span>{row.code} - {row.name}</span><span className="font-medium">{formatCurrency(sign === "abs" ? Math.abs(row.balance) : row.balance)}</span></div>)}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 mb-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground mb-3">Laporan Detail</h2>
        <p className="text-sm text-muted-foreground">Neraca, laba rugi, dan arus kas berbasis grouping akun dari jurnal.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {renderGroup("Neraca - Aset", assets)}
        <Card><CardContent className="p-4 space-y-4">{renderGroup("Neraca - Kewajiban", liabilities, "abs")}{renderGroup("Neraca - Ekuitas", equities, "abs")}<div className="flex justify-between font-semibold border-t pt-3"><span>Total Kewajiban + Ekuitas</span><span>{formatCurrency(totalLiabilities + totalEquity)}</span></div></CardContent></Card>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {renderGroup("Laba Rugi - Pendapatan", revenues, "abs")}
        <Card><CardContent className="p-4 space-y-4">{renderGroup("Laba Rugi - Beban", expenses, "abs")}<div className="flex justify-between font-semibold border-t pt-3"><span>Laba Bersih</span><span>{formatCurrency(totalRevenue - totalExpense)}</span></div></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Arus Kas Ringkas</h3>
          <div className="flex justify-between text-sm"><span>Kas & Setara Kas</span><span className="font-medium">{formatCurrency(assets.filter((account) => ["Kas", "Bank"].some((keyword) => account.name.includes(keyword))).reduce((sum, account) => sum + account.balance, 0))}</span></div>
          <div className="flex justify-between text-sm"><span>Penerimaan (Pendapatan)</span><span className="font-medium">{formatCurrency(totalRevenue)}</span></div>
          <div className="flex justify-between text-sm"><span>Pengeluaran (Beban)</span><span className="font-medium">{formatCurrency(totalExpense)}</span></div>
          <div className="flex justify-between font-semibold border-t pt-3"><span>Arus Kas Bersih</span><span>{formatCurrency(totalRevenue - totalExpense)}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
