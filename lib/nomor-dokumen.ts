import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { deliveryOrders, invoices, payments, quotations, supplierPos } from "@/db/schema";

// Nomor dokumen (keputusan owner 11/11): NNNN/MUI/KODE/BULAN-ROMAWI/TAHUN, urut per jenis, mulai 0001 tiap 1 Januari.
// Nomor diambil & disimpan pas dokumen dibuat (kolom `nomor`), gak berubah walau tanggalnya diubah.
// Dokumen lama (sebelum migrasi 0025) nyimpen nomor lamanya persis (ID + bulan/tahun tanggal dokumen).

export type JenisDokumen = "SP" | "INV" | "SJ" | "PO" | "KW";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Konek = Tx | typeof db;

const TABEL: Record<JenisDokumen, string> = {
  SP: "quotations",
  INV: "invoices",
  SJ: "delivery_orders",
  PO: "supplier_pos",
  KW: "payments",
};

const ROMAWI = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const WIB_MS = 7 * 60 * 60 * 1000;

// Bulan & tahun menurut jam Indonesia (WIB), sama dengan yang selama ini dicetak di PDF (browser di WIB).
export function bulanTahunWib(tanggal: Date) {
  const w = new Date(tanggal.getTime() + WIB_MS);
  return { bulan: w.getUTCMonth() + 1, tahun: w.getUTCFullYear() };
}

export function formatNomor(urut: number, jenis: JenisDokumen, tanggal: Date) {
  const { bulan, tahun } = bulanTahunWib(tanggal);
  return `${String(urut).padStart(4, "0")}/MUI/${jenis}/${ROMAWI[bulan - 1]}/${tahun}`;
}

// Rumus nomor lama (dipakai cuma buat dokumen yang belum punya nomor tersimpan).
export function nomorLama(jenis: JenisDokumen, id: number, tanggal: Date | string | number | null | undefined) {
  if (jenis === "KW") return `KWT-PAY-${String(id).padStart(4, "0")}`;
  const t = tanggal ? new Date(tanggal) : new Date();
  return formatNomor(id, jenis, Number.isNaN(t.getTime()) ? new Date() : t);
}

// Nomor yang ditampilin di mana-mana: nomor tersimpan, atau rumus lama kalau masih kosong.
export function nomorDokumen(jenis: JenisDokumen, id: number, nomor: string | null | undefined, tanggal: Date | string | number | null | undefined) {
  return nomor || nomorLama(jenis, id, tanggal);
}

// Kode pendek lama (QUO-0079, INV-0049, …) = ID baris. Gak tampil di layar lagi, tapi masih bisa dipakai nyari.
const AWALAN_LAMA: Record<JenisDokumen, string> = { SP: "QUO", INV: "INV", SJ: "SJ", PO: "POS", KW: "PAY" };
export function kodeId(jenis: JenisDokumen, id: number) {
  return `${AWALAN_LAMA[jenis]}-${String(id).padStart(4, "0")}`;
}

const sqlRomawi = sql.raw(
  `CASE CAST(strftime('%m', date, 'unixepoch', '+7 hours') AS INTEGER) ${ROMAWI.map((r, i) => `WHEN ${i + 1} THEN '${r}'`).join(" ")} END`,
);
const sqlRumusLama = (jenis: JenisDokumen) =>
  jenis === "KW"
    ? sql.raw(`'KWT-PAY-' || printf('%04d', id)`)
    : sql`printf('%04d', id) || ${`/MUI/${jenis}/`} || ${sqlRomawi} || '/' || strftime('%Y', date, 'unixepoch', '+7 hours')`;

// Dokumen yang dibikin CRM versi lama setelah migrasi 0025 tapi sebelum kode ini dipasang gak punya nomor tersimpan.
// Diisi pakai rumus lama (sama dengan yang udah tercetak). Murah (lewat indeks nomor), jadi dipanggil tiap ambil nomor
// & sebelum tanggal dokumen diubah, pakai koneksi/transaksi yang sama.
export async function isiNomorKosong(k: Konek, jenis: JenisDokumen) {
  await k.run(sql`UPDATE ${sql.identifier(TABEL[jenis])} SET nomor = ${sqlRumusLama(jenis)} WHERE nomor IS NULL`);
}

// Ambil nomor berikutnya buat dokumen baru. Satu perintah atomik (INSERT … ON CONFLICT … RETURNING), jadi dua
// dokumen yang disimpan barengan dapet nomor beda. Penghitung gak pernah di bawah nomor terbesar yang udah tersimpan
// di tahun itu (termasuk nomor lama), plus ada penjaga unik di kolom nomor. Panggil di dalam transaksi pembuatnya
// biar kalau simpan gagal, penghitungnya ikut batal.
export async function ambilNomor(k: Konek, jenis: JenisDokumen, tanggal: Date): Promise<string> {
  await isiNomorKosong(k, jenis);
  const { tahun } = bulanTahunWib(tanggal);
  const tabel = sql.identifier(TABEL[jenis]);
  const pola = `%/MUI/${jenis}/%/${tahun}`;
  const maksBaru = sql`(SELECT max(CAST(substr(nomor, 1, instr(nomor, '/') - 1) AS INTEGER)) FROM ${tabel} WHERE nomor LIKE ${pola})`;
  const maksLama =
    jenis === "KW"
      ? sql`(SELECT max(CAST(substr(nomor, 9) AS INTEGER)) FROM ${tabel} WHERE nomor LIKE 'KWT-PAY-%' AND strftime('%Y', date, 'unixepoch', '+7 hours') = ${String(tahun)})`
      : sql`0`;
  const maks = sql`max(coalesce(${maksBaru}, 0), coalesce(${maksLama}, 0))`;
  const row = await k.get<{ terakhir: number }>(sql`
    INSERT INTO nomor_dokumen (jenis, tahun, terakhir) VALUES (${jenis}, ${tahun}, ${maks} + 1)
    ON CONFLICT(jenis, tahun) DO UPDATE SET terakhir = max(nomor_dokumen.terakhir, ${maks}) + 1
    RETURNING terakhir`);
  const urut = Number(row?.terakhir);
  if (!urut) throw new Error("Gagal mengambil nomor dokumen");
  return formatNomor(urut, jenis, tanggal);
}

// Nomor tampil satu dokumen dari ID-nya (buat pesan notifikasi & error).
export async function cariNomor(jenis: JenisDokumen, id: number): Promise<string> {
  const tabel = { SP: quotations, INV: invoices, SJ: deliveryOrders, PO: supplierPos, KW: payments }[jenis];
  const [row] = await db.select({ nomor: tabel.nomor, date: tabel.date }).from(tabel).where(eq(tabel.id, id));
  return row ? nomorDokumen(jenis, id, row.nomor, row.date) : kodeId(jenis, id);
}
