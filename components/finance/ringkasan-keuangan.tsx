import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Clock, TrendingDown, TrendingUp } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { PILIHAN_PERIODE, type RingkasanKeuangan as Data } from "@/lib/ringkasan-keuangan";

function tanggal(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function keteranganHari(hari: number) {
  if (hari > 0) return { teks: `lewat ${hari} hari`, kelas: "bg-rose-100 text-rose-700" };
  if (hari === 0) return { teks: "jatuh tempo hari ini", kelas: "bg-amber-100 text-amber-700" };
  return { teks: `${Math.abs(hari)} hari lagi`, kelas: "bg-slate-100 text-slate-600" };
}

export function RingkasanKeuangan({ data }: { data: Data }) {
  const untung = data.untung >= 0;
  return (
    <section className="space-y-4 mb-8" aria-label="Ringkasan keuangan">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Ringkasan {data.judulPeriode}</h2>
          <p className="text-sm text-muted-foreground">Uang yang beneran masuk dan keluar di periode ini.</p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Pilih periode">
          {PILIHAN_PERIODE.map((item) => (
            <Link
              key={item.value}
              href={`/finance?periode=${item.value}`}
              scroll={false}
              className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors ${data.periode === item.value ? "border-primary bg-primary text-white" : "bg-white text-slate-600 hover:bg-muted"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><ArrowUpCircle className="size-4 text-emerald-600" /> Uang masuk</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrency(data.uangMasuk)}</div>
          <p className="mt-1 text-xs text-muted-foreground">{data.jumlahPembayaran} pembayaran dari klien</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><ArrowDownCircle className="size-4 text-rose-600" /> Uang keluar</div>
          <div className="mt-2 text-2xl font-bold text-rose-700">{formatCurrency(data.uangKeluar)}</div>
          <p className="mt-1 text-xs text-muted-foreground">{data.jumlahPengeluaran} pengeluaran tercatat</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${untung ? "bg-primary text-white" : "bg-rose-50"}`}>
          <div className={`flex items-center gap-2 text-sm font-medium ${untung ? "text-white/80" : "text-rose-700"}`}>
            {untung ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />} {untung ? "Untung" : "Rugi"}
          </div>
          <div className={`mt-2 text-2xl font-bold ${untung ? "text-white" : "text-rose-700"}`}>{formatCurrency(Math.abs(data.untung))}</div>
          <p className={`mt-1 text-xs ${untung ? "text-white/80" : "text-rose-700/80"}`}>Uang masuk dikurangi uang keluar</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Clock className="size-4 text-amber-600" /> Piutang (belum dibayar klien)</div>
            <div className="mt-1 text-2xl font-bold text-amber-700">{formatCurrency(data.totalPiutang)}</div>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.piutang.length} tagihan dari {data.piutangPerKlien.length} klien
            {data.piutangLewat > 0 ? <> · <span className="font-medium text-rose-700">{formatCurrency(data.piutangLewat)} sudah lewat jatuh tempo</span></> : null}
          </p>
        </div>
        {data.piutang.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Semua tagihan sudah lunas.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-xl border">
            {data.piutang.map((row) => {
              const ket = keteranganHari(row.hariLewat);
              return (
                <li key={row.invoiceId}>
                  <Link href={`/invoices?q=${encodeURIComponent(row.code)}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">{row.clientName}</div>
                      <div className="text-xs text-muted-foreground">{row.code} · jatuh tempo {tanggal(row.dueDate)}{row.amountPaid > 0 ? ` · sudah dibayar ${formatCurrency(row.amountPaid)}` : ""}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ket.kelas}`}>{ket.teks}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(row.sisa)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
