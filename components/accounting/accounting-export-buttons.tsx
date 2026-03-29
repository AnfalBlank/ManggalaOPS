"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";

type LedgerEntry = { date: string; description: string; accountCode: string; debit: number; credit: number };
type TaxRow = { date: string; source: string; client: string; dpp: number; ppn: number; total: number; type: string };

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(","), ...rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

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

export function LedgerExportButton({ entries }: { entries: LedgerEntry[] }) {
  return (
    <Button variant="outline" className="gap-2" onClick={() => downloadCsv(`ledger-${new Date().toISOString().slice(0, 10)}.csv`, ["Date", "Description", "Account", "Debit", "Credit"], entries.map((entry) => [entry.date, entry.description, entry.accountCode, entry.debit, entry.credit]))}>
      <FileSpreadsheet className="size-4" /> Export Ledger
    </Button>
  );
}

export function TaxReportPdfButton({ rows, periodLabel }: { rows: TaxRow[]; periodLabel: string }) {
  return (
    <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={() => {
      const doc = new jsPDF("p", "mm", "a4");
      const totalDpp = rows.reduce((sum, row) => sum + row.dpp, 0);
      const totalPpn = rows.reduce((sum, row) => sum + row.ppn, 0);
      const totalGrand = rows.reduce((sum, row) => sum + row.total, 0);

      drawDocumentHeader(doc, "Laporan Pajak", `Periode ${periodLabel}`);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 14, 44);

      autoTable(doc, {
        startY: 50,
        head: [["Tanggal", "Sumber", "Jenis", "Client", "DPP", "PPN", "Total"]],
        body: rows.map((row) => [row.date, row.source, row.type, row.client, row.dpp.toLocaleString("id-ID"), row.ppn.toLocaleString("id-ID"), row.total.toLocaleString("id-ID")]),
        foot: [["", "", "", "TOTAL", totalDpp.toLocaleString("id-ID"), totalPpn.toLocaleString("id-ID"), totalGrand.toLocaleString("id-ID")]],
        theme: "grid",
        headStyles: { fillColor: [19, 70, 122] },
        footStyles: { fillColor: [230, 238, 246], textColor: [0, 0, 0], fontStyle: "bold" },
        styles: { fontSize: 8.5 },
      });

      doc.save(`laporan-pajak-${new Date().toISOString().slice(0, 10)}.pdf`);
    }}>
      <FileText className="size-4" /> Export PDF Pajak
    </Button>
  );
}
