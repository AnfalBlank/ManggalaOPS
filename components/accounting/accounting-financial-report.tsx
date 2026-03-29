"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, Landmark, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type FinancialSummary = {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquityProxy: number;
  cashOnHand: number;
  bankBalance: number;
  receivables: number;
};

function drawDocumentHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(19, 70, 122);
  doc.rect(0, 0, 210, 10, "F");
  doc.setFillColor(47, 128, 237);
  doc.rect(0, 10, 210, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(19, 70, 122);
  doc.setFontSize(18);
  doc.text(title, 14, 24);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  doc.setFontSize(9);
  doc.text(subtitle, 14, 30);
  doc.line(14, 36, 196, 36);
}

export function AccountingFinancialReport({ summary, periodLabel }: { summary: FinancialSummary; periodLabel: string }) {
  const exportPdf = () => {
    const doc = new jsPDF("p", "mm", "a4");
    drawDocumentHeader(doc, "Laporan Keuangan", `Periode ${periodLabel}`);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 14, 44);

    autoTable(doc, {
      startY: 50,
      head: [["Kelompok", "Nilai"]],
      body: [
        ["Pendapatan", formatCurrency(summary.totalRevenue)],
        ["Beban", formatCurrency(summary.totalExpense)],
        ["Laba Bersih", formatCurrency(summary.netProfit)],
        ["Total Aset", formatCurrency(summary.totalAssets)],
        ["Total Kewajiban", formatCurrency(summary.totalLiabilities)],
        ["Estimasi Ekuitas", formatCurrency(summary.totalEquityProxy)],
        ["Kas", formatCurrency(summary.cashOnHand)],
        ["Saldo Bank", formatCurrency(summary.bankBalance)],
        ["Piutang Usaha", formatCurrency(summary.receivables)],
      ],
      theme: "grid",
      headStyles: { fillColor: [19, 70, 122] },
      styles: { fontSize: 9 },
    });

    doc.save(`laporan-keuangan-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Laporan Keuangan</h2>
          <p className="text-sm text-muted-foreground">Ringkasan posisi keuangan, performa laba rugi, dan akun kas utama. Dipisah dari pelaporan pajak.</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={exportPdf}><FileText className="size-4" /> Download PDF Keuangan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="border-emerald-200 bg-emerald-50/40"><CardContent className="p-4"><div className="flex items-center gap-2 text-emerald-700 mb-2"><TrendingUp className="size-4" /><span className="text-xs font-semibold uppercase tracking-wide">Pendapatan</span></div><div className="text-xl font-bold text-emerald-700">{formatCurrency(summary.totalRevenue)}</div></CardContent></Card>
        <Card className="border-rose-200 bg-rose-50/40"><CardContent className="p-4"><div className="flex items-center gap-2 text-rose-700 mb-2"><TrendingDown className="size-4" /><span className="text-xs font-semibold uppercase tracking-wide">Beban</span></div><div className="text-xl font-bold text-rose-700">{formatCurrency(summary.totalExpense)}</div></CardContent></Card>
        <Card className="border-blue-200 bg-blue-50/40"><CardContent className="p-4"><div className="flex items-center gap-2 text-blue-700 mb-2"><Landmark className="size-4" /><span className="text-xs font-semibold uppercase tracking-wide">Laba Bersih</span></div><div className="text-xl font-bold text-blue-700">{formatCurrency(summary.netProfit)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">Total Aset</div><div className="text-lg font-bold">{formatCurrency(summary.totalAssets)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">Total Kewajiban</div><div className="text-lg font-bold">{formatCurrency(summary.totalLiabilities)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">Estimasi Ekuitas</div><div className="text-lg font-bold">{formatCurrency(summary.totalEquityProxy)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/70"><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground mb-2"><Wallet className="size-4" /><span className="text-xs uppercase tracking-wide">Kas</span></div><div className="text-lg font-bold">{formatCurrency(summary.cashOnHand)}</div></CardContent></Card>
        <Card className="border-border/70"><CardContent className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Saldo Bank</div><div className="text-lg font-bold">{formatCurrency(summary.bankBalance)}</div></CardContent></Card>
        <Card className="border-border/70"><CardContent className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Piutang Usaha</div><div className="text-lg font-bold">{formatCurrency(summary.receivables)}</div></CardContent></Card>
      </div>
    </div>
  );
}
