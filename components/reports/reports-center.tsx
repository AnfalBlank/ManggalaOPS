"use client";

import { useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
import { motion } from "framer-motion";
import { Briefcase, BarChart3, Calculator, PiggyBank } from "lucide-react";

import { ExportReportButtons } from "@/components/reports/export-report-buttons";
import { LabaRugiTabel } from "@/components/reports/laba-rugi-tabel";
import type { DataLaba } from "@/lib/laba-rugi";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ReportRow = Record<string, string | number | null | undefined>;

export type LaporanData = {
  id: "pengeluaran" | "penjualan" | "proyek" | "pajak";
  rows: ReportRow[];
  kunciTanggal: string;
  kunciTanggalCadangan?: string;
  kunciNilai: string;
  labelNilai: string;
  filterNilai?: { kunci: string; nilai: string };
};

const INFO: Record<LaporanData["id"], { title: string; description: string; icon: typeof Calculator; color: string; bg: string }> = {
  pengeluaran: { title: "Pengeluaran", description: "Semua biaya yang dicatat di periode terpilih.", icon: Calculator, color: "text-blue-600", bg: "bg-blue-50" },
  penjualan: { title: "Penjualan & tagihan", description: "Calon klien, tagihan terbit, dan pembayaran masuk di periode terpilih.", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },
  proyek: { title: "Proyek", description: "Status dan nilai proyek yang mulai (atau tenggatnya) di periode terpilih.", icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50" },
  pajak: { title: "Pajak (PPN)", description: "PPN dari tagihan yang terbit di periode terpilih.", icon: PiggyBank, color: "text-amber-600", bg: "bg-amber-50" },
};

function withinRange(value: string | number | null | undefined, start: string, end: string) {
  if (!value) return false;
  const date = new Date(String(value));
  const from = new Date(start);
  const to = new Date(end);
  to.setHours(23, 59, 59, 999);
  return !Number.isNaN(date.getTime()) && date >= from && date <= to;
}

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export function ReportsCenter({ laporan, laba }: { laporan: LaporanData[]; laba?: DataLaba | null }) {
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const lastMonthDate = format(subMonths(new Date(), 1), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(lastMonthDate);
  const [endDate, setEndDate] = useState(currentDate);

  const reports = useMemo(() => laporan.map((item) => {
    const rows = item.rows.filter((row) => withinRange(row[item.kunciTanggal] || (item.kunciTanggalCadangan ? row[item.kunciTanggalCadangan] : null), startDate, endDate));
    const total = rows
      .filter((row) => !item.filterNilai || row[item.filterNilai.kunci] === item.filterNilai.nilai)
      .reduce((sum, row) => {
        const amount = Number(row[item.kunciNilai] ?? 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0);
    return { ...item, ...INFO[item.id], rows, total };
  }), [endDate, laporan, startDate]);

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Laporan</h1>
          <p className="text-muted-foreground mt-1">Pilih periode, lalu unduh laporan dari data asli CRM.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="space-y-2">
          <Label>Dari tanggal</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Sampai tanggal</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {laba ? <LabaRugiTabel data={laba} dari={startDate} sampai={endDate} /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {reports.map((report, idx) => (
          <motion.div key={report.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.08 }}>
            <Card className="h-full border-border/60 hover:border-blue-200 transition-colors shadow-sm group">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`size-10 rounded-xl ${report.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <report.icon className={`size-5 ${report.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="mt-1">{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="text-xs uppercase text-muted-foreground tracking-wide">Jumlah data</div>
                      <div className="text-lg font-bold mt-1">{report.rows.length}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3 min-w-0">
                      <div className="text-xs uppercase text-muted-foreground tracking-wide">{report.labelNilai}</div>
                      <div className="text-lg font-bold mt-1 break-words">{rupiah(report.total)}</div>
                    </div>
                  </div>
                  <ExportReportButtons title={`Laporan ${report.title} (${startDate} s/d ${endDate})`} filenamePrefix={`laporan-${report.id}-${endDate}`} rows={report.rows} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </PageWrapper>
  );
}
