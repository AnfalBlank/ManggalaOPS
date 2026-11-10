import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/db";
import {
  clientPoItems,
  clientPos,
  clients,
  deliveryOrderItems,
  deliveryOrders,
  invoices,
  payments,
  quotations,
  supplierPoItems,
  supplierPos,
} from "@/db/schema";
import { getDeliveryOrders } from "@/lib/data-delivery";
import { formatDocumentNumber } from "@/lib/format";

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);

export const STATUS_PO_SUPPLIER = ["Draft", "Dikirim ke supplier", "Barang diterima", "Batal"] as const;

export type Tahap = { kunci: string; label: string; keadaan: "beres" | "jalan" | "belum" | "lewat"; keterangan: string };

export type PoRingkas = {
  id: number;
  poNumber: string;
  poDate: string | null;
  quotationId: number;
  quotationCode: string;
  quotationSubject: string | null;
  clientId: number;
  clientName: string;
  projectId: number | null;
  value: number;
  fileUrl: string | null;
  notes: string | null;
  closedAt: string | null;
  qtyTotal: number;
  qtyDikirim: number;
  ditagih: number;
  dibayar: number;
  supplierTotal: number;
  supplierBelumDiterima: number;
  posisi: string;
  selesai: boolean;
  tahap: Tahap[];
};

function hitungTahap(p: {
  value: number;
  qtyTotal: number;
  qtyDikirim: number;
  ditagih: number;
  dibayar: number;
  supplierTotal: number;
  supplierBelumDiterima: number;
  closedAt: string | null;
}): { tahap: Tahap[]; posisi: string; selesai: boolean } {
  const nilai = p.value > 0 ? p.value : p.ditagih;
  const terkirimSemua = p.qtyTotal > 0 && p.qtyDikirim >= p.qtyTotal;
  const tertagihSemua = nilai > 0 && p.ditagih >= nilai - 1;
  const lunas = p.ditagih > 0 && p.dibayar >= p.ditagih - 1 && tertagihSemua;

  const supplier: Tahap =
    p.supplierTotal === 0
      ? { kunci: "supplier", label: "PO ke supplier", keadaan: p.qtyDikirim > 0 ? "lewat" : "belum", keterangan: p.qtyDikirim > 0 ? "Gak pakai supplier" : "Belum dipesan" }
      : p.supplierBelumDiterima > 0
        ? { kunci: "supplier", label: "PO ke supplier", keadaan: "jalan", keterangan: `${p.supplierBelumDiterima} dari ${p.supplierTotal} belum datang` }
        : { kunci: "supplier", label: "PO ke supplier", keadaan: "beres", keterangan: "Barang udah diterima" };
  const kirim: Tahap = terkirimSemua
    ? { kunci: "kirim", label: "Surat jalan", keadaan: "beres", keterangan: "Terkirim semua" }
    : p.qtyDikirim > 0
      ? { kunci: "kirim", label: "Surat jalan", keadaan: "jalan", keterangan: `${p.qtyDikirim} dari ${p.qtyTotal} terkirim` }
      : { kunci: "kirim", label: "Surat jalan", keadaan: "belum", keterangan: "Belum dikirim" };
  const tagih: Tahap = tertagihSemua
    ? { kunci: "tagih", label: "Tagihan", keadaan: "beres", keterangan: "Udah ditagih semua" }
    : p.ditagih > 0
      ? { kunci: "tagih", label: "Tagihan", keadaan: "jalan", keterangan: "Ditagih sebagian" }
      : { kunci: "tagih", label: "Tagihan", keadaan: "belum", keterangan: "Belum ditagih" };
  const bayar: Tahap = lunas
    ? { kunci: "bayar", label: "Pembayaran", keadaan: "beres", keterangan: "Lunas" }
    : p.dibayar > 0
      ? { kunci: "bayar", label: "Pembayaran", keadaan: "jalan", keterangan: "Dibayar sebagian" }
      : { kunci: "bayar", label: "Pembayaran", keadaan: "belum", keterangan: "Belum dibayar" };

  const tahap = [{ kunci: "po", label: "PO klien", keadaan: "beres", keterangan: "Udah dicatat" } as Tahap, supplier, kirim, tagih, bayar];

  if (p.closedAt) return { tahap, posisi: "Ditutup", selesai: true };
  if (terkirimSemua && lunas) return { tahap, posisi: "Selesai", selesai: true };

  let posisi: string;
  if (!terkirimSemua) {
    if (p.supplierBelumDiterima > 0) posisi = "Nunggu barang dari supplier";
    else if (p.qtyDikirim > 0) posisi = "Dikirim sebagian";
    else if (p.supplierTotal === 0) posisi = "Belum pesan ke supplier / belum dikirim";
    else posisi = "Barang siap, belum dikirim";
  } else if (!tertagihSemua) {
    posisi = p.ditagih > 0 ? "Ditagih sebagian" : "Terkirim, belum ditagih";
  } else {
    posisi = p.dibayar > 0 ? "Dibayar sebagian" : "Nunggu pembayaran";
  }
  return { tahap, posisi, selesai: false };
}

export async function getClientPoList(): Promise<PoRingkas[]> {
  const rows = await db
    .select({
      id: clientPos.id,
      poNumber: clientPos.poNumber,
      poDate: clientPos.poDate,
      quotationId: clientPos.quotationId,
      quotationSubject: quotations.subject,
      clientId: clientPos.clientId,
      clientName: clients.name,
      projectId: clientPos.projectId,
      value: clientPos.value,
      fileUrl: clientPos.fileUrl,
      notes: clientPos.notes,
      closedAt: clientPos.closedAt,
    })
    .from(clientPos)
    .innerJoin(clients, eq(clientPos.clientId, clients.id))
    .innerJoin(quotations, eq(clientPos.quotationId, quotations.id))
    .orderBy(desc(clientPos.id));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [items, kirim, tagihan, sup] = await Promise.all([
    db.select({ id: clientPoItems.id, poId: clientPoItems.clientPoId, qty: clientPoItems.qty }).from(clientPoItems).where(inArray(clientPoItems.clientPoId, ids)),
    db
      .select({ poItemId: deliveryOrderItems.clientPoItemId, qty: deliveryOrderItems.qty })
      .from(deliveryOrderItems)
      .innerJoin(deliveryOrders, eq(deliveryOrderItems.deliveryOrderId, deliveryOrders.id))
      .where(and(inArray(deliveryOrders.clientPoId, ids), ne(deliveryOrders.status, "Cancelled"))),
    db.select({ id: invoices.id, poId: invoices.clientPoId, total: invoices.total }).from(invoices).where(inArray(invoices.clientPoId, ids)),
    db.select({ poId: supplierPos.clientPoId, status: supplierPos.status }).from(supplierPos).where(inArray(supplierPos.clientPoId, ids)),
  ]);
  const invIds = tagihan.map((t) => t.id);
  const bayar = invIds.length
    ? await db.select({ invoiceId: payments.invoiceId, amount: payments.amount }).from(payments).where(inArray(payments.invoiceId, invIds))
    : [];

  const itemKePo = new Map(items.map((i) => [i.id, i.poId]));
  const invKePo = new Map(tagihan.map((t) => [t.id, t.poId]));

  return rows.map((r) => {
    const qtyTotal = items.filter((i) => i.poId === r.id).reduce((s, i) => s + i.qty, 0);
    const qtyDikirim = kirim.filter((k) => k.poItemId && itemKePo.get(k.poItemId) === r.id).reduce((s, k) => s + k.qty, 0);
    const ditagih = tagihan.filter((t) => t.poId === r.id).reduce((s, t) => s + (t.total ?? 0), 0);
    const dibayar = bayar.filter((b) => invKePo.get(b.invoiceId) === r.id).reduce((s, b) => s + b.amount, 0);
    const supPo = sup.filter((s) => s.poId === r.id && s.status !== "Batal");
    const supplierBelumDiterima = supPo.filter((s) => s.status !== "Barang diterima").length;
    const dasar = {
      value: r.value ?? 0,
      qtyTotal,
      qtyDikirim: Math.min(qtyDikirim, qtyTotal),
      ditagih,
      dibayar,
      supplierTotal: supPo.length,
      supplierBelumDiterima,
      closedAt: iso(r.closedAt),
    };
    return {
      ...dasar,
      id: r.id,
      poNumber: r.poNumber,
      poDate: iso(r.poDate),
      quotationId: r.quotationId,
      quotationCode: formatDocumentNumber("QUO", r.quotationId),
      quotationSubject: r.quotationSubject,
      clientId: r.clientId,
      clientName: r.clientName,
      projectId: r.projectId,
      fileUrl: r.fileUrl,
      notes: r.notes,
      ...hitungTahap(dasar),
    };
  });
}

export type PoItem = { id: number; description: string; qty: number; unit: string; unitPrice: number; unitCost: number; amount: number; dikirim: number };
export type PoSupplier = {
  id: number;
  code: string;
  clientPoId: number;
  poNumber: string;
  clientName: string;
  supplierName: string;
  supplierContact: string | null;
  supplierPhone: string | null;
  supplierAddress: string | null;
  date: string | null;
  expectedDate: string | null;
  paymentTerms: string | null;
  notes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  items: { description: string; qty: number; unit: string; unitPrice: number; amount: number }[];
};

export async function getSupplierPoList(filter?: { clientPoId?: number }): Promise<PoSupplier[]> {
  const base = db
    .select({ s: supplierPos, poNumber: clientPos.poNumber, clientName: clients.name })
    .from(supplierPos)
    .innerJoin(clientPos, eq(supplierPos.clientPoId, clientPos.id))
    .innerJoin(clients, eq(clientPos.clientId, clients.id));
  const rows = await (filter?.clientPoId ? base.where(eq(supplierPos.clientPoId, filter.clientPoId)) : base).orderBy(desc(supplierPos.id));
  if (rows.length === 0) return [];
  const items = await db.select().from(supplierPoItems).where(inArray(supplierPoItems.supplierPoId, rows.map((r) => r.s.id)));
  return rows.map(({ s, poNumber, clientName }) => ({
    id: s.id,
    code: formatDocumentNumber("POS", s.id),
    clientPoId: s.clientPoId,
    poNumber,
    clientName,
    supplierName: s.supplierName,
    supplierContact: s.supplierContact,
    supplierPhone: s.supplierPhone,
    supplierAddress: s.supplierAddress,
    date: iso(s.date),
    expectedDate: iso(s.expectedDate),
    paymentTerms: s.paymentTerms,
    notes: s.notes,
    subtotal: s.subtotal ?? 0,
    tax: s.tax ?? 0,
    total: s.total ?? 0,
    status: s.status ?? "Draft",
    items: items
      .filter((i) => i.supplierPoId === s.id)
      .map((i) => ({ description: i.description, qty: i.qty, unit: i.unit ?? "Unit", unitPrice: i.unitPrice, amount: i.amount })),
  }));
}

export async function getClientPoItems(clientPoId: number): Promise<PoItem[]> {
  const [items, kirim] = await Promise.all([
    db.select().from(clientPoItems).where(eq(clientPoItems.clientPoId, clientPoId)).orderBy(clientPoItems.id),
    db
      .select({ poItemId: deliveryOrderItems.clientPoItemId, qty: deliveryOrderItems.qty })
      .from(deliveryOrderItems)
      .innerJoin(deliveryOrders, eq(deliveryOrderItems.deliveryOrderId, deliveryOrders.id))
      .where(and(eq(deliveryOrders.clientPoId, clientPoId), ne(deliveryOrders.status, "Cancelled"))),
  ]);
  return items.map((i) => ({
    id: i.id,
    description: i.description,
    qty: i.qty,
    unit: i.unit ?? "Unit",
    unitPrice: i.unitPrice,
    unitCost: i.unitCost ?? 0,
    amount: i.amount,
    dikirim: kirim.filter((k) => k.poItemId === i.id).reduce((s, k) => s + k.qty, 0),
  }));
}

export async function getClientPoDetail(id: number) {
  const list = await getClientPoList();
  const po = list.find((p) => p.id === id);
  if (!po) return null;
  const quotation = await db.query.quotations.findFirst({ where: eq(quotations.id, po.quotationId) });
  const client = await db.query.clients.findFirst({ where: eq(clients.id, po.clientId) });
  const [items, suratJalan, poSupplier] = await Promise.all([
    getClientPoItems(id),
    getDeliveryOrders().then((list) => list.filter((d) => d.clientPoId === id)),
    getSupplierPoList({ clientPoId: id }),
  ]);
  return {
    po,
    items,
    suratJalan,
    poSupplier,
    penerima: {
      name: quotation?.recipientName ?? client?.contactPerson ?? null,
      company: quotation?.recipientCompany ?? client?.name ?? null,
      address: quotation?.recipientAddress ?? client?.address ?? null,
      phone: client?.phone ?? null,
    },
    tagihanDefault: {
      subject: quotation?.subject ?? null,
      paymentMethod: quotation?.paymentMethod ?? null,
      taxPercent: quotation?.subtotal ? Math.round(((quotation.tax ?? 0) / quotation.subtotal) * 10000) / 100 : 11,
    },
  };
}

export type PoDetail = NonNullable<Awaited<ReturnType<typeof getClientPoDetail>>>;
