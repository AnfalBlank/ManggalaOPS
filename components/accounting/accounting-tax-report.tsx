"use client";

import { useMemo, useState } from "react";

import { TaxReportPdfButton } from "@/components/accounting/accounting-export-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

type TaxRow = { date: string; source: string; client: string; dpp: number; ppn: number; total: number; type: string };

function withinRange(dateValue: string, startDate: string, endDate: string) {
  const date = new Date(dateValue);
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return !Number.isNaN(date.getTime()) && date >= start && date <= end;
}

export function AccountingTaxReport({ rows }: { rows: TaxRow[] }) {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const filtered = useMemo(() => rows.filter((row) => withinRange(row.date, startDate, endDate)), [endDate, rows, startDate]);
  const totalPpnKeluaran = filtered.filter((row) => row.type === "PPN Keluaran").reduce((sum, row) => sum + row.ppn, 0);
  const totalPpnMasukan = filtered.filter((row) => row.type === "PPN Masukan").reduce((sum, row) => sum + row.ppn, 0);
  const totalDpp = filtered.reduce((sum, row) => sum + row.dpp, 0);
  const totalPpn = filtered.reduce((sum, row) => sum + row.ppn, 0);
  const totalGrand = filtered.reduce((sum, row) => sum + row.total, 0);
  const periodLabel = `${startDate} s/d ${endDate}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Laporan Pajak</h2>
          <p className="text-sm text-muted-foreground">Rekap formal PPN Keluaran dan PPN Masukan dari invoice, quotation accepted, serta pembelian/expense kena pajak.</p>
        </div>
        <div className="flex gap-2"><TaxReportPdfButton rows={filtered} periodLabel={periodLabel} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2"><Label>Periode Mulai</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="space-y-2"><Label>Periode Akhir</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">Total DPP</div><div className="text-lg font-bold text-blue-700">{formatCurrency(totalDpp)}</div></div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">PPN Keluaran</div><div className="text-lg font-bold text-rose-700">{formatCurrency(totalPpnKeluaran)}</div></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">PPN Masukan</div><div className="text-lg font-bold text-amber-700">{formatCurrency(totalPpnMasukan)}</div></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">Selisih Pajak</div><div className="text-lg font-bold text-emerald-700">{formatCurrency(totalPpnKeluaran - totalPpnMasukan)}</div></div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border">
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">DPP</TableHead>
              <TableHead className="text-right">PPN</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row, index) => (
              <TableRow key={`${row.source}-${index}`}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.source}</TableCell>
                <TableCell><span className={row.type === "PPN Masukan" ? "text-amber-700 font-medium" : "text-rose-700 font-medium"}>{row.type}</span></TableCell>
                <TableCell>{row.client}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.dpp)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.ppn)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
