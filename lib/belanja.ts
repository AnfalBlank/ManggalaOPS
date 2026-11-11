import { and, eq, gte, lt, ne } from "drizzle-orm";

import { db } from "@/db";
import { clientPos, expenses, supplierPos } from "@/db/schema";
import { ensure, ensurePositiveInt, ValidationError } from "@/lib/api-helpers";

// Nota harus file hasil /api/upload (nama acak, cuma huruf/angka). Selain itu ditolak biar gak bisa ngisi link luar.
const POLA_NOTA = /^\/api\/uploads\/[A-Za-z0-9._-]{1,128}$/;

export type TautanBelanja = {
  clientPoId: number | null;
  supplierPoId: number | null;
  projectId: number | null;
  receiptUrl: string | null;
};

/**
 * Baca & cek sambungan pengeluaran ke PO klien, PO supplier, proyek, dan nota.
 * - PO supplier harus milik PO klien yang dipilih (kalau PO klien kosong, diambil dari PO supplier).
 * - Proyek diambil dari PO klien kalau PO-nya punya proyek, jadi gak bisa salah pilih.
 * - Belanja yang nyambung ke PO klien wajib ada notanya.
 */
export async function bacaTautanBelanja(body: Record<string, unknown>): Promise<TautanBelanja> {
  let clientPoId = body.clientPoId ? ensurePositiveInt(body.clientPoId, "PO klien") : null;
  const supplierPoId = body.supplierPoId ? ensurePositiveInt(body.supplierPoId, "PO supplier") : null;
  let projectId = body.projectId ? ensurePositiveInt(body.projectId, "Proyek") : null;
  const receiptRaw = typeof body.receiptUrl === "string" ? body.receiptUrl.trim() : "";
  const receiptUrl = receiptRaw ? receiptRaw.replace(/^\/uploads\//, "/api/uploads/") : null;
  if (receiptUrl) ensure(POLA_NOTA.test(receiptUrl), "File nota gak valid. Unggah ulang notanya.");

  if (supplierPoId) {
    const sup = await db.query.supplierPos.findFirst({ where: eq(supplierPos.id, supplierPoId) });
    ensure(sup, "PO supplier tidak ditemukan");
    if (clientPoId) ensure(sup.clientPoId === clientPoId, "PO supplier itu bukan buat PO klien yang dipilih");
    clientPoId = sup.clientPoId;
  }
  if (clientPoId) {
    const po = await db.query.clientPos.findFirst({ where: eq(clientPos.id, clientPoId) });
    ensure(po, "PO klien tidak ditemukan");
    if (po.projectId) projectId = po.projectId;
    ensure(receiptUrl, "Belanja buat PO wajib ada foto/PDF notanya");
  }
  return { clientPoId, supplierPoId, projectId, receiptUrl };
}

export class BelanjaDobelError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = "BelanjaDobelError";
  }
}

/**
 * Peringatan dobel: pengeluaran dengan tanggal & nominal sama persis, plus PO klien sama (atau kalau tanpa PO:
 * keterangan sama), udah ada. Gak nolak mati: pengguna boleh lanjut dengan `konfirmasiDobel: true`.
 */
export async function cekBelanjaDobel(opsi: {
  date: Date;
  amount: number;
  clientPoId: number | null;
  description: string;
  receiptUrl: string | null;
  kecualiId?: number;
  konfirmasi: boolean;
}) {
  if (opsi.konfirmasi) return;
  const awal = new Date(opsi.date);
  awal.setHours(0, 0, 0, 0);
  const akhir = new Date(awal);
  akhir.setDate(akhir.getDate() + 1);
  const syarat = [gte(expenses.date, awal), lt(expenses.date, akhir)];
  if (opsi.kecualiId) syarat.push(ne(expenses.id, opsi.kecualiId));
  const kembar = await db
    .select({ id: expenses.id, amount: expenses.amount, clientPoId: expenses.clientPoId, description: expenses.description, receiptUrl: expenses.receiptUrl })
    .from(expenses)
    .where(and(...syarat));
  const sama = kembar.find((e) => {
    if (opsi.receiptUrl && e.receiptUrl === opsi.receiptUrl) return true;
    if (Math.abs((e.amount ?? 0) - opsi.amount) >= 1) return false;
    if (opsi.clientPoId) return e.clientPoId === opsi.clientPoId;
    return !e.clientPoId && e.description.trim().toLowerCase() === opsi.description.trim().toLowerCase();
  });
  if (sama) {
    throw new BelanjaDobelError(
      `Kayaknya dobel: EXP-${String(sama.id).padStart(4, "0")} udah dicatat dengan tanggal & nominal yang sama${opsi.clientPoId ? " buat PO ini" : ""}. Cek dulu. Kalau memang beda belanja, pilih "Tetap simpan".`,
    );
  }
}
