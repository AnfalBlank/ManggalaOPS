import { and, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { clientPoItems, clientPos, deliveryOrderItems, deliveryOrders, invoices, payments } from "@/db/schema";
import { ValidationError } from "@/lib/api-helpers";
import { formatCurrency } from "@/lib/format";

// Penjaga input dobel di server. Cara aman dari "dua orang simpan bareng": data DITULIS dulu di dalam transaksi,
// baru dicek pakai fungsi di bawah (masih di transaksi yang sama). Kalau lewat batas, error dilempar dan transaksi
// dibatalkan. Di SQLite/Turso cuma satu transaksi tulis yang jalan sekaligus, jadi yang kedua pasti liat data yang
// pertama.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Konek = Tx | typeof db;

export const normalNomor = (nomor: string) => nomor.trim().replace(/\s+/g, " ").toLowerCase();

// Nomor PO klien gak boleh dobel buat klien yang sama (beda huruf besar/kecil & spasi dianggap sama).
export async function cekNomorPoKlien(k: Konek, clientId: number, poNumber: string, kecualiId?: number) {
  const rows = await k.select({ id: clientPos.id, poNumber: clientPos.poNumber }).from(clientPos).where(eq(clientPos.clientId, clientId));
  const target = normalNomor(poNumber);
  const kembar = rows.filter((r) => r.id !== kecualiId && normalNomor(r.poNumber) === target);
  if (kembar.length > 0) throw new ValidationError(`Nomor PO "${poNumber}" udah dipakai buat klien ini. Cek lagi, mungkin PO-nya udah dicatat.`);
}

// Total semua tagihan 1 PO klien gak boleh lewat nilai PO (toleransi Rp 1 buat pecahan sen).
export async function cekTotalTagihanPo(k: Konek, clientPoId: number) {
  const [po] = await k.select({ value: clientPos.value, poNumber: clientPos.poNumber }).from(clientPos).where(eq(clientPos.id, clientPoId));
  if (!po) throw new ValidationError("PO klien tidak ditemukan");
  const nilai = po.value ?? 0;
  if (nilai <= 0) return; // PO tanpa nilai: gak ada batas
  const [r] = await k.select({ total: sql<number>`coalesce(sum(${invoices.total}), 0)` }).from(invoices).where(eq(invoices.clientPoId, clientPoId));
  const total = Number(r?.total ?? 0);
  if (total > nilai + 1) {
    throw new ValidationError(
      `Total tagihan PO ${po.poNumber} jadi ${formatCurrency(total)}, lewat nilai PO ${formatCurrency(nilai)}. Kalau nilai PO memang naik (ada addendum), ubah dulu nilai PO-nya di halaman PO.`,
    );
  }
}

// Nilai PO baru gak boleh di bawah total tagihan yang udah terbit.
export async function cekNilaiPoCukup(k: Konek, clientPoId: number, nilaiBaru: number) {
  if (nilaiBaru <= 0) return;
  const [r] = await k.select({ total: sql<number>`coalesce(sum(${invoices.total}), 0)` }).from(invoices).where(eq(invoices.clientPoId, clientPoId));
  const total = Number(r?.total ?? 0);
  if (total > nilaiBaru + 1) throw new ValidationError(`Nilai PO gak boleh di bawah total tagihan yang udah terbit (${formatCurrency(total)}).`);
}

// Barang yang dikirim (surat jalan yang gak dibatalkan) gak boleh lewat jumlah di PO.
export async function cekSisaKirimPo(k: Konek, clientPoId: number) {
  const items = await k.select({ id: clientPoItems.id, qty: clientPoItems.qty, description: clientPoItems.description, unit: clientPoItems.unit }).from(clientPoItems).where(eq(clientPoItems.clientPoId, clientPoId));
  const kirim = await k
    .select({ itemId: deliveryOrderItems.clientPoItemId, qty: sql<number>`coalesce(sum(${deliveryOrderItems.qty}), 0)` })
    .from(deliveryOrderItems)
    .innerJoin(deliveryOrders, eq(deliveryOrderItems.deliveryOrderId, deliveryOrders.id))
    .where(and(eq(deliveryOrders.clientPoId, clientPoId), ne(deliveryOrders.status, "Cancelled")))
    .groupBy(deliveryOrderItems.clientPoItemId);
  for (const item of items) {
    const dikirim = Number(kirim.find((x) => x.itemId === item.id)?.qty ?? 0);
    if (dikirim > item.qty) {
      throw new ValidationError(`"${item.description.split("\n")[0]}" di PO cuma ${item.qty} ${item.unit ?? ""}, total surat jalan jadi ${dikirim}. Cek surat jalan lain yang udah dibikin.`);
    }
  }
}

// Pembayaran 1 tagihan gak boleh lewat total tagihan (toleransi Rp 1).
export async function cekBayarTagihan(k: Konek, invoiceId: number) {
  const [inv] = await k.select({ total: invoices.total }).from(invoices).where(eq(invoices.id, invoiceId));
  if (!inv) throw new ValidationError("Tagihan tidak ditemukan");
  const [r] = await k.select({ paid: sql<number>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(eq(payments.invoiceId, invoiceId));
  const paid = Number(r?.paid ?? 0);
  if (paid > (inv.total ?? 0) + 1) throw new ValidationError(`Jumlah bayar lebih dari sisa tagihan. Total tagihan ${formatCurrency(inv.total ?? 0)}, yang udah dibayar jadi ${formatCurrency(paid)}.`);
}
