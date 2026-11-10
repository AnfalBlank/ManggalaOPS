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

function tanggal(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
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
  const periodLabel = `${tanggal(startDate)} s/d ${tanggal(endDate)}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Laporan Pajak</h2>
          <p className="text-sm text-muted-foreground">Rekap PPN keluaran dari tagihan dan PPN masukan dari pengeluaran yang kena pajak.</p>
        </div>
        <div className="flex gap-2"><TaxReportPdfButton rows={filtered.map((row) => ({ ...row, date: tanggal(row.date) }))} periodLabel={periodLabel} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2"><Label>Periode mulai</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="space-y-2"><Label>Periode akhir</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">Total DPP</div><div className="text-lg font-bold text-blue-700">{formatCurrency(totalDpp)}</div></div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">PPN Keluaran</div><div className="text-lg font-bold text-rose-700">{formatCurrency(totalPpnKeluaran)}</div></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">PPN Masukan</div><div className="text-lg font-bold text-amber-700">{formatCurrency(totalPpnMasukan)}</div></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">Selisih PPN</div><div className="text-lg font-bold text-emerald-700">{formatCurrency(totalPpnKeluaran - totalPpnMasukan)}</div></div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border max-md:border-0">
        <Table className="min-w-[820px] xl:min-w-0">
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Klien / keterangan</TableHead>
              <TableHead className="text-right">DPP</TableHead>
              <TableHead className="text-right">PPN</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row, index) => (
              <TableRow key={`${row.source}-${index}`}>
                <TableCell>{tanggal(row.date)}</TableCell>
                <TableCell>{row.source}</TableCell>
                <TableCell><span className={row.type === "PPN Masukan" ? "text-amber-700 font-medium" : "text-rose-700 font-medium"}>{row.type}</span></TableCell>
                <TableCell>{row.client}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.dpp)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.ppn)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Gak ada transaksi kena PPN di periode ini.</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
