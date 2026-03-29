"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";

type AccountRow = { code: string; name: string; type: string; balance: number };

function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, 14, 25);
}

function formatPeriodLabel(startDate: string, endDate: string) {
  const end = new Date(`${endDate}T00:00:00`);
  return `Periode Tutup Buku: ${end.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`;
}

export function ExecutiveFinancialReport({ accounts }: { accounts: AccountRow[] }) {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodAccounts, setPeriodAccounts] = useState<AccountRow[]>(accounts);
  const [cutoffAccounts, setCutoffAccounts] = useState<AccountRow[]>(accounts);

  useEffect(() => {
    fetch(`/api/accounting/executive-report?startDate=${startDate}&endDate=${endDate}`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload.periodAccounts) setPeriodAccounts(payload.periodAccounts);
        if (payload.cutoffAccounts) setCutoffAccounts(payload.cutoffAccounts);
      })
      .catch(() => null);
  }, [startDate, endDate]);

  const incomeStatement = useMemo(() => {
    const revenues = periodAccounts.filter((account) => account.type === "Revenue").map((account) => ({ ...account, value: Math.abs(account.balance) }));
    const expenses = periodAccounts.filter((account) => account.type === "Expense").map((account) => ({ ...account, value: Math.abs(account.balance) }));
    const totalRevenue = revenues.reduce((sum, account) => sum + account.value, 0);
    const totalExpense = expenses.reduce((sum, account) => sum + account.value, 0);
    return { revenues, expenses, totalRevenue, totalExpense, netIncome: totalRevenue - totalExpense };
  }, [periodAccounts]);

  const balanceSheet = useMemo(() => {
    const currentAssets = cutoffAccounts.filter((account) => account.type === "Asset" && /Kas|Bank|Piutang|Persediaan/i.test(account.name)).map((account) => ({ ...account, value: account.balance }));
    const fixedAssets = cutoffAccounts.filter((account) => account.type === "Asset" && !/Kas|Bank|Piutang|Persediaan/i.test(account.name)).map((account) => ({ ...account, value: account.balance }));
    const liabilities = cutoffAccounts.filter((account) => account.type === "Liability").map((account) => ({ ...account, value: Math.abs(account.balance) }));
    const equity = cutoffAccounts.filter((account) => account.type === "Equity").map((account) => ({ ...account, value: Math.abs(account.balance) }));
    const totalAssets = [...currentAssets, ...fixedAssets].reduce((sum, account) => sum + account.value, 0);
    const totalLiabilities = liabilities.reduce((sum, account) => sum + account.value, 0);
    const retainedEarnings = incomeStatement.netIncome;
    const totalEquity = equity.reduce((sum, account) => sum + account.value, 0) + retainedEarnings;
    return { currentAssets, fixedAssets, liabilities, equity, totalAssets, totalLiabilities, retainedEarnings, totalEquity };
  }, [cutoffAccounts, incomeStatement.netIncome]);

  const exportPdf = () => {
    const doc = new jsPDF("p", "mm", "a4");
    drawHeader(doc, "Laporan Keuangan Eksekutif PT. Manggala Utama Indonesia", formatPeriodLabel(startDate, endDate));

    autoTable(doc, {
      startY: 34,
      theme: "grid",
      body: [["A. LAPORAN LABA RUGI (Income Statement)", ""]],
      styles: { fontStyle: "bold", fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      columnStyles: { 1: { halign: "right" } },
    });
    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY,
      head: [["PENDAPATAN", ""]],
      body: [
        ...incomeStatement.revenues.map((row) => [row.name, formatCurrency(row.value)]),
        ["Total Pendapatan", formatCurrency(incomeStatement.totalRevenue)],
        ["BEBAN OPERASIONAL & HPP", ""],
        ...incomeStatement.expenses.map((row) => [row.name, `(${formatCurrency(row.value)})`]),
        ["Total Beban", `(${formatCurrency(incomeStatement.totalExpense)})`],
        ["LABA BERSIH TAHUN BERJALAN (NET INCOME)", formatCurrency(incomeStatement.netIncome)],
      ],
      theme: "grid",
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      bodyStyles: { textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      didParseCell: (data) => {
        const text = String(data.cell.raw ?? "");
        if (text.includes("LABA BERSIH TAHUN BERJALAN")) {
          data.cell.styles.textColor = [34, 139, 34];
          data.cell.styles.fontStyle = "bold";
        }
        if (text === "PENDAPATAN" || text === "BEBAN OPERASIONAL & HPP") {
          data.cell.styles.fontStyle = "bold";
        }
      },
      columnStyles: { 1: { halign: "right" } },
    });

    autoTable(doc, {
      startY: ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 100) + 8,
      theme: "grid",
      body: [["B. NERACA KEUANGAN (Balance Sheet)", ""]],
      styles: { fontStyle: "bold", fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      columnStyles: { 1: { halign: "right" } },
    });
    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY,
      head: [["I. ASET (HARTA)", ""]],
      body: [
        ["Aset Lancar", ""],
        ...balanceSheet.currentAssets.map((row) => [row.name, formatCurrency(row.value)]),
        ["Aset Tetap", ""],
        ...balanceSheet.fixedAssets.map((row) => [row.name, formatCurrency(row.value)]),
        ["TOTAL ASET", formatCurrency(balanceSheet.totalAssets)],
        ["II. KEWAJIBAN & EKUITAS (PASIVA)", ""],
        ["Kewajiban (Hutang)", ""],
        ...balanceSheet.liabilities.map((row) => [row.name, formatCurrency(row.value)]),
        ["Ekuitas (Modal Pemilik)", ""],
        ...balanceSheet.equity.map((row) => [row.name, formatCurrency(row.value)]),
        ["Laba Tahun Berjalan (Net Income)", formatCurrency(balanceSheet.retainedEarnings)],
        ["TOTAL KEWAJIBAN & EKUITAS", formatCurrency(balanceSheet.totalLiabilities + balanceSheet.totalEquity)],
      ],
      theme: "grid",
      headStyles: { fillColor: [214, 230, 245], textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      didParseCell: (data) => {
        const text = String(data.cell.raw ?? "");
        if (text === "II. KEWAJIBAN & EKUITAS (PASIVA)") {
          data.cell.styles.fillColor = [255, 243, 205];
          data.cell.styles.fontStyle = "bold";
        }
        if (["Aset Lancar", "Aset Tetap", "Kewajiban (Hutang)", "Ekuitas (Modal Pemilik)"].includes(text)) {
          data.cell.styles.fontStyle = "bold";
        }
        if (["TOTAL ASET", "TOTAL KEWAJIBAN & EKUITAS"].includes(text)) {
          data.cell.styles.fontStyle = "bold";
        }
      },
      columnStyles: { 1: { halign: "right" } },
    });
    doc.save(`laporan-keuangan-eksekutif-${endDate}.pdf`);
  };

  const periodLabel = formatPeriodLabel(startDate, endDate);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6 mb-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-foreground">Laporan Keuangan Eksekutif PT. Manggala Utama Indonesia</h2>
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={exportPdf}><FileText className="size-4" /> Download PDF</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Periode Mulai</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="space-y-2"><Label>Periode Akhir / Tutup Buku</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="p-4 font-bold text-lg">A. LAPORAN LABA RUGI (Income Statement)</div>
          <table className="w-full text-sm border-t">
            <tbody>
              <tr className="bg-muted/40 font-semibold"><td className="border px-3 py-2">PENDAPATAN</td><td className="border px-3 py-2 text-right"></td></tr>
              {incomeStatement.revenues.map((row) => <tr key={row.code}><td className="border px-3 py-2">{row.name}</td><td className="border px-3 py-2 text-right">{formatCurrency(row.value)}</td></tr>)}
              <tr className="font-semibold"><td className="border px-3 py-2">Total Pendapatan</td><td className="border px-3 py-2 text-right">{formatCurrency(incomeStatement.totalRevenue)}</td></tr>
              <tr className="bg-muted/40 font-semibold"><td className="border px-3 py-2">BEBAN OPERASIONAL &amp; HPP</td><td className="border px-3 py-2 text-right"></td></tr>
              {incomeStatement.expenses.map((row) => <tr key={row.code}><td className="border px-3 py-2">{row.name}</td><td className="border px-3 py-2 text-right">({formatCurrency(row.value)})</td></tr>)}
              <tr className="font-semibold"><td className="border px-3 py-2">Total Beban</td><td className="border px-3 py-2 text-right">({formatCurrency(incomeStatement.totalExpense)})</td></tr>
              <tr className="font-bold text-green-600"><td className="border px-3 py-2">LABA BERSIH TAHUN BERJALAN (NET INCOME)</td><td className="border px-3 py-2 text-right">{formatCurrency(incomeStatement.netIncome)}</td></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="p-4 font-bold text-lg">B. NERACA KEUANGAN (Balance Sheet)</div>
          <table className="w-full text-sm border-t">
            <tbody>
              <tr className="bg-blue-100 font-semibold"><td className="border px-3 py-2">I. ASET (HARTA)</td><td className="border px-3 py-2 text-right"></td></tr>
              <tr className="font-semibold"><td className="border px-3 py-2">Aset Lancar</td><td className="border px-3 py-2 text-right"></td></tr>
              {balanceSheet.currentAssets.map((row) => <tr key={row.code}><td className="border px-3 py-2">{row.name}</td><td className="border px-3 py-2 text-right">{formatCurrency(row.value)}</td></tr>)}
              <tr className="font-semibold"><td className="border px-3 py-2">Aset Tetap</td><td className="border px-3 py-2 text-right"></td></tr>
              {balanceSheet.fixedAssets.map((row) => <tr key={row.code}><td className="border px-3 py-2">{row.name}</td><td className="border px-3 py-2 text-right">{formatCurrency(row.value)}</td></tr>)}
              <tr className="font-bold"><td className="border px-3 py-2">TOTAL ASET</td><td className="border px-3 py-2 text-right">{formatCurrency(balanceSheet.totalAssets)}</td></tr>
              <tr className="bg-amber-100 font-semibold"><td className="border px-3 py-2">II. KEWAJIBAN &amp; EKUITAS (PASIVA)</td><td className="border px-3 py-2 text-right"></td></tr>
              <tr className="font-semibold"><td className="border px-3 py-2">Kewajiban (Hutang)</td><td className="border px-3 py-2 text-right"></td></tr>
              {balanceSheet.liabilities.map((row) => <tr key={row.code}><td className="border px-3 py-2">{row.name}</td><td className="border px-3 py-2 text-right">{formatCurrency(row.value)}</td></tr>)}
              <tr className="font-semibold"><td className="border px-3 py-2">Ekuitas (Modal Pemilik)</td><td className="border px-3 py-2 text-right"></td></tr>
              {balanceSheet.equity.map((row) => <tr key={row.code}><td className="border px-3 py-2">{row.name}</td><td className="border px-3 py-2 text-right">{formatCurrency(row.value)}</td></tr>)}
              <tr><td className="border px-3 py-2">Laba Tahun Berjalan (Net Income)</td><td className="border px-3 py-2 text-right">{formatCurrency(balanceSheet.retainedEarnings)}</td></tr>
              <tr className="font-bold"><td className="border px-3 py-2">TOTAL KEWAJIBAN &amp; EKUITAS</td><td className="border px-3 py-2 text-right">{formatCurrency(balanceSheet.totalLiabilities + balanceSheet.totalEquity)}</td></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
