import { getExpenses, getInvoices, getPayments } from "@/lib/data";

// Ringkasan keuangan bahasa awam buat halaman Keuangan.
// Cuma baca data yang udah ada: pembayaran (uang masuk), pengeluaran (uang keluar), tagihan (piutang).

export type PeriodeRingkasan = "bulan-ini" | "bulan-lalu" | "tahun-ini" | "semua";

export const PILIHAN_PERIODE: { value: PeriodeRingkasan; label: string }[] = [
  { value: "bulan-ini", label: "Bulan ini" },
  { value: "bulan-lalu", label: "Bulan lalu" },
  { value: "tahun-ini", label: "Tahun ini" },
  { value: "semua", label: "Semua" },
];

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export function bacaPeriode(value: string | undefined): PeriodeRingkasan {
  return PILIHAN_PERIODE.some((item) => item.value === value) ? (value as PeriodeRingkasan) : "tahun-ini";
}

function rentang(periode: PeriodeRingkasan, now: Date): { mulai: Date | null; akhir: Date | null; judul: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (periode === "bulan-ini") return { mulai: new Date(y, m, 1), akhir: new Date(y, m + 1, 1), judul: `${NAMA_BULAN[m]} ${y}` };
  if (periode === "bulan-lalu") {
    const awal = new Date(y, m - 1, 1);
    return { mulai: awal, akhir: new Date(y, m, 1), judul: `${NAMA_BULAN[awal.getMonth()]} ${awal.getFullYear()}` };
  }
  if (periode === "tahun-ini") return { mulai: new Date(y, 0, 1), akhir: new Date(y + 1, 0, 1), judul: `Tahun ${y}` };
  return { mulai: null, akhir: null, judul: "Semua waktu" };
}

function masukRentang(value: string | null | undefined, mulai: Date | null, akhir: Date | null) {
  if (!mulai || !akhir) return true;
  if (!value) return false;
  const tanggal = new Date(value);
  if (Number.isNaN(tanggal.getTime())) return false;
  return tanggal >= mulai && tanggal < akhir;
}

const SEHARI = 24 * 60 * 60 * 1000;

function awalHari(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export type BarisPiutang = {
  invoiceId: number;
  code: string;
  clientName: string;
  total: number;
  amountPaid: number;
  sisa: number;
  dueDate: string | null;
  hariLewat: number; // > 0 = sudah lewat jatuh tempo sekian hari, <= 0 = belum jatuh tempo
  status: string;
};

export async function getRingkasanKeuangan(periode: PeriodeRingkasan, now = new Date()) {
  const [payments, expenses, invoices] = await Promise.all([getPayments(), getExpenses(), getInvoices()]);
  const { mulai, akhir, judul } = rentang(periode, now);

  const pembayaran = payments.filter((payment) => masukRentang(payment.date, mulai, akhir));
  const pengeluaran = expenses.filter((expense) => masukRentang(expense.date, mulai, akhir));
  const uangMasuk = pembayaran.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const uangKeluar = pengeluaran.reduce((sum, expense) => sum + (expense.amount ?? 0), 0);

  // Piutang = tagihan yang masih ada sisanya (sama dengan kolom "Sisa" di halaman Tagihan), gak tergantung periode.
  const hariIni = awalHari(now);
  const piutang: BarisPiutang[] = invoices
    .filter((invoice) => invoice.outstandingAmount > 0 && invoice.status !== "Paid")
    .map((invoice) => {
      const due = invoice.dueDate ? awalHari(new Date(invoice.dueDate)) : null;
      const hariLewat = due ? Math.round((hariIni.getTime() - due.getTime()) / SEHARI) : 0;
      return {
        invoiceId: invoice.id,
        code: invoice.code,
        clientName: invoice.clientName,
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        sisa: invoice.outstandingAmount,
        dueDate: invoice.dueDate,
        hariLewat,
        status: invoice.status,
      };
    })
    .sort((a, b) => b.hariLewat - a.hariLewat || b.sisa - a.sisa);

  const perKlien = new Map<string, { clientName: string; sisa: number; jumlahTagihan: number; hariLewatTerlama: number }>();
  for (const row of piutang) {
    const lama = perKlien.get(row.clientName) ?? { clientName: row.clientName, sisa: 0, jumlahTagihan: 0, hariLewatTerlama: -Infinity };
    lama.sisa += row.sisa;
    lama.jumlahTagihan += 1;
    lama.hariLewatTerlama = Math.max(lama.hariLewatTerlama, row.hariLewat);
    perKlien.set(row.clientName, lama);
  }

  return {
    periode,
    judulPeriode: judul,
    uangMasuk,
    uangKeluar,
    untung: uangMasuk - uangKeluar,
    jumlahPembayaran: pembayaran.length,
    jumlahPengeluaran: pengeluaran.length,
    totalPiutang: piutang.reduce((sum, row) => sum + row.sisa, 0),
    piutangLewat: piutang.filter((row) => row.hariLewat > 0).reduce((sum, row) => sum + row.sisa, 0),
    piutang,
    piutangPerKlien: [...perKlien.values()].sort((a, b) => b.sisa - a.sisa),
  };
}

export type RingkasanKeuangan = Awaited<ReturnType<typeof getRingkasanKeuangan>>;
