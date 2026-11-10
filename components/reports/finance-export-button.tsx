"use client";

import { FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinanceExportButton({ rows }: { rows: { date: string; category: string; description: string; amount: number; status: string }[] }) {
  const onExport = () => {
    const header = ["Tanggal", "Kategori", "Keterangan", "Nominal", "Status"];
    const csv = [header.join(","), ...rows.map((row) => [row.date, row.category, row.description, row.amount, row.status].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pengeluaran-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <Button variant="outline" className="gap-2" onClick={onExport}><FileSpreadsheet className="size-4" /> Unduh CSV pengeluaran</Button>;
}
