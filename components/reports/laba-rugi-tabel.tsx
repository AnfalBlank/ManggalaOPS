"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { ExportReportButtons } from "@/components/reports/export-report-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hitungLaba, type BarisLaba, type DataLaba } from "@/lib/laba-rugi";

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const persen = (m: number | null) => (m === null ? "-" : `${m.toLocaleString("id-ID")}%`);

function keCsv(rows: BarisLaba[], jenis: "po" | "proyek") {
  return rows.map((b) => ({
    ...(jenis === "po" ? { "No. PO": b.nama, Klien: b.klien, "Nilai PO": Math.round(b.nilaiPo ?? 0) } : { Proyek: b.nama, Klien: b.klien }),
    "Tagihan terbit (dengan PPN)": Math.round(b.tagihanTotal),
    "Pendapatan (tanpa PPN)": Math.round(b.pendapatan),
    "Uang masuk": Math.round(b.uangMasuk),
    "Belanja (tanpa PPN)": Math.round(b.belanja),
    "Untung/rugi": Math.round(b.untung),
    "Margin (%)": b.margin ?? "",
  }));
}

function Tabel({ rows, jenis, total }: { rows: BarisLaba[]; jenis: "po" | "proyek"; total: { tagihanTotal: number; pendapatan: number; uangMasuk: number; belanja: number; untung: number; margin: number | null } }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Belum ada tagihan atau belanja di periode ini.</p>;
  return (
    <div className="w-full overflow-x-auto rounded-xl border max-md:border-0">
      <Table className="min-w-[860px] xl:min-w-0">
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs uppercase tracking-wider">{jenis === "po" ? "PO klien" : "Proyek"}</TableHead>
            {jenis === "po" ? <TableHead className="text-right text-xs uppercase tracking-wider">Nilai PO</TableHead> : null}
            <TableHead className="text-right text-xs uppercase tracking-wider">Pendapatan</TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wider">Uang masuk</TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wider">Belanja</TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wider">Untung/rugi</TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wider">Margin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="py-3">
                {jenis === "po" ? (
                  <Link href={`/po/${b.id}`} className="font-medium text-primary underline">PO {b.nama}</Link>
                ) : (
                  <span className="font-medium text-slate-900">{b.nama}</span>
                )}
                <p className="text-xs text-muted-foreground">{b.klien}</p>
              </TableCell>
              {jenis === "po" ? <TableCell className="text-right tabular-nums">{rupiah(b.nilaiPo ?? 0)}</TableCell> : null}
              <TableCell className="text-right tabular-nums">{rupiah(b.pendapatan)}</TableCell>
              <TableCell className="text-right tabular-nums">{rupiah(b.uangMasuk)}</TableCell>
              <TableCell className="text-right tabular-nums">{rupiah(b.belanja)}</TableCell>
              <TableCell className={`text-right font-semibold tabular-nums ${b.untung < 0 ? "text-rose-700" : "text-emerald-700"}`}>{rupiah(b.untung)}</TableCell>
              <TableCell className="text-right tabular-nums">{persen(b.margin)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/30 font-semibold">
            <TableCell className="py-3">Jumlah</TableCell>
            {jenis === "po" ? <TableCell className="text-right">-</TableCell> : null}
            <TableCell className="text-right tabular-nums">{rupiah(total.pendapatan)}</TableCell>
            <TableCell className="text-right tabular-nums">{rupiah(total.uangMasuk)}</TableCell>
            <TableCell className="text-right tabular-nums">{rupiah(total.belanja)}</TableCell>
            <TableCell className={`text-right tabular-nums ${total.untung < 0 ? "text-rose-700" : "text-emerald-700"}`}>{rupiah(total.untung)}</TableCell>
            <TableCell className="text-right tabular-nums">{persen(total.margin)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export function LabaRugiTabel({ data, dari, sampai }: { data: DataLaba; dari: string; sampai: string }) {
  const [semua, setSemua] = useState(false);
  const hasil = useMemo(() => (semua ? hitungLaba(data) : hitungLaba(data, dari, sampai)), [data, dari, sampai, semua]);
  const label = semua ? "semua waktu" : `${dari} s/d ${sampai}`;

  return (
    <Card className="mb-8 border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Untung/rugi per PO & per proyek</CardTitle>
            <CardDescription className="mt-1">
              Pendapatan = tagihan yang terbit di periode ini, tanpa PPN. Belanja = pengeluaran di periode ini yang nyambung ke PO/proyek,
              tanpa PPN. Untung = pendapatan − belanja. Uang masuk cuma info (pelunasan tagihan yang sama), gak ditambahin lagi.
            </CardDescription>
          </div>
          <label className="inline-flex shrink-0 items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={semua} onChange={(e) => setSemua(e.target.checked)} /> Semua waktu
          </label>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <section className="grid gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-base font-semibold">Per PO klien</h2>
            <p className="text-sm text-muted-foreground">{hasil.po.length} PO · {label}</p>
          </div>
          <Tabel rows={hasil.po} jenis="po" total={hasil.totalPo} />
          <ExportReportButtons title={`Untung/rugi per PO (${label})`} filenamePrefix={`untung-rugi-per-po-${semua ? "semua" : sampai}`} rows={keCsv(hasil.po, "po")} />
        </section>
        <section className="grid gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-base font-semibold">Per proyek</h2>
            <p className="text-sm text-muted-foreground">{hasil.proyek.length} proyek · {label}</p>
          </div>
          <Tabel rows={hasil.proyek} jenis="proyek" total={hasil.totalProyek} />
          <p className="text-sm text-muted-foreground">
            Pengeluaran tanpa proyek/PO (biaya kantor umum) di periode ini: {rupiah(hasil.belanjaTanpaProyek)} ({hasil.jumlahTanpaProyek} catatan, tanpa PPN). Gak masuk tabel di atas.
          </p>
          <ExportReportButtons title={`Untung/rugi per proyek (${label})`} filenamePrefix={`untung-rugi-per-proyek-${semua ? "semua" : sampai}`} rows={keCsv(hasil.proyek, "proyek")} />
        </section>
      </CardContent>
    </Card>
  );
}
