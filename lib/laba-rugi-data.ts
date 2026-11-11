import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { clientPos, clients, expenses, invoices, payments, projects, quotations } from "@/db/schema";
import { formatDocumentNumber } from "@/lib/format";
import type { DataLaba } from "@/lib/laba-rugi";
import { namaProyek } from "@/lib/label-status";

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : "");

// Ambil bahan hitung untung/rugi. Cuma buat admin & finance (pemanggil wajib cek jabatan).
export async function getDataLaba(): Promise<DataLaba> {
  const [tagihan, bayar, belanja, po, proyek] = await Promise.all([
    db.select({ id: invoices.id, date: invoices.date, clientPoId: invoices.clientPoId, projectId: invoices.projectId, subtotal: invoices.subtotal, total: invoices.total }).from(invoices),
    db.select({ invoiceId: payments.invoiceId, date: payments.date, amount: payments.amount }).from(payments),
    db.select({ id: expenses.id, date: expenses.date, clientPoId: expenses.clientPoId, projectId: expenses.projectId, base: expenses.baseAmount, amount: expenses.amount }).from(expenses),
    db
      .select({ id: clientPos.id, poNumber: clientPos.poNumber, clientName: clients.name, projectId: clientPos.projectId, value: clientPos.value, qSubtotal: quotations.subtotal, qTax: quotations.tax })
      .from(clientPos)
      .innerJoin(clients, eq(clientPos.clientId, clients.id))
      .leftJoin(quotations, eq(clientPos.quotationId, quotations.id)),
    db.select({ id: projects.id, name: projects.name, clientName: clients.name }).from(projects).leftJoin(clients, eq(projects.clientId, clients.id)),
  ]);

  return {
    tagihan: tagihan.map((t) => ({ id: t.id, date: iso(t.date), clientPoId: t.clientPoId, projectId: t.projectId, subtotal: t.subtotal ?? 0, total: t.total ?? 0 })),
    bayar: bayar.map((p) => ({ invoiceId: p.invoiceId, date: iso(p.date), amount: p.amount ?? 0 })),
    belanja: belanja.map((e) => ({ id: e.id, date: iso(e.date), clientPoId: e.clientPoId, projectId: e.projectId, dpp: e.base || e.amount || 0, total: e.amount ?? 0 })),
    po: po.map((p) => {
      const nilai = p.value ?? 0;
      // Nilai PO disimpan termasuk PPN (ikut total penawaran). Perkiraan tanpa PPN pakai persen PPN penawarannya.
      const persen = p.qSubtotal ? (p.qTax ?? 0) / p.qSubtotal : 0;
      return { id: p.id, poNumber: p.poNumber, clientName: p.clientName, projectId: p.projectId, nilai, nilaiDpp: Math.round(nilai / (1 + persen)) };
    }),
    proyek: proyek.map((p) => ({ id: p.id, code: formatDocumentNumber("PRJ", p.id), name: namaProyek(p.name), clientName: p.clientName ?? "-" })),
  };
}

// Daftar belanja (pengeluaran) yang nyambung ke 1 PO klien.
export async function getBelanjaPo(clientPoId: number) {
  const rows = await db
    .select({ id: expenses.id, date: expenses.date, category: expenses.category, description: expenses.description, amount: expenses.amount, base: expenses.baseAmount, supplierPoId: expenses.supplierPoId, receiptUrl: expenses.receiptUrl, status: expenses.status })
    .from(expenses)
    .where(eq(expenses.clientPoId, clientPoId))
    .orderBy(desc(expenses.date), desc(expenses.id));
  return rows.map((r) => ({ ...r, code: formatDocumentNumber("EXP", r.id), date: iso(r.date) }));
}
