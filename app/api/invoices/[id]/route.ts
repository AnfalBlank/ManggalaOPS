import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clientPos, invoiceItems, invoices } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { deleteInvoiceJournal, upsertInvoiceJournal } from "@/lib/business";
import { getInvoices } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { computeOutputTax, normalizeTaxPercent } from "@/lib/output-tax";
import { ensureInvoiceCanBeDeleted, ensureInvoiceCanBeUpdated } from "@/lib/validators";
import { cekTotalTagihanPo } from "@/lib/cegah-dobel";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance", "sales"]);
    const { id } = await params;
    const invoiceId = ensurePositiveInt(id, "invoice id");
    const body = await request.json();
    const items = (Array.isArray(body.items) ? body.items : []) as Array<{ description?: string; qty?: number | string; unit?: string; unitPrice?: number | string; amount?: number | string }>;
    ensure(items.length > 0, "Isi minimal satu baris barang/jasa");
    const subtotal = items.reduce((sum: number, item) => sum + parseMoneyInput(item.amount), 0);
    const { tax, total } = computeOutputTax(subtotal, normalizeTaxPercent(body.taxPercent, 11));

    await ensureInvoiceCanBeUpdated(invoiceId, total);
    const lama = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
    ensure(lama, "Tagihan tidak ditemukan");
    const clientId = ensurePositiveInt(body.clientId, "clientId");
    if (lama.clientPoId) {
      const po = await db.query.clientPos.findFirst({ where: eq(clientPos.id, lama.clientPoId) });
      ensure(!po || po.clientId === clientId, "Tagihan ini nyambung ke PO klien, kliennya gak bisa diganti");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(invoices)
        .set({
          clientId,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          paymentMethod: trimString(body.paymentMethod, 50) || "CBD",
          attachment: nullableTrim(body.attachment, 500),
          subject: nullableTrim(body.subject, 500),
          recipientName: nullableTrim(body.recipientName, 200),
          recipientCompany: nullableTrim(body.recipientCompany, 200),
          recipientAddress: nullableTrim(body.recipientAddress, 500),
          introduction: nullableTrim(body.introduction, 2000),
          terms: nullableTrim(body.terms, 5000),
          closingNote: nullableTrim(body.closingNote, 2000),
          signatoryName: nullableTrim(body.signatoryName, 200),
          signatoryTitle: nullableTrim(body.signatoryTitle, 200),
          subtotal,
          tax,
          total,
        })
        .where(eq(invoices.id, invoiceId));

      await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
      if (items.length > 0) {
        await tx.insert(invoiceItems).values(items.map((item) => ({
          invoiceId,
          description: trimString(item.description, 1000),
          qty: Math.max(1, Number(item.qty ?? 0) || 1),
          unit: trimString(item.unit, 50) || "Unit",
          unitPrice: parseMoneyInput(item.unitPrice),
          amount: parseMoneyInput(item.amount),
        })));
      }
      if (lama.clientPoId) await cekTotalTagihanPo(tx, lama.clientPoId);
    });

    await upsertInvoiceJournal(invoiceId);
    await audit({ userId: user.id, action: "invoice.update", entity: "invoice", entityId: invoiceId, payload: { total } });
    return NextResponse.json({ ok: true, data: await getInvoices() });
  } catch (error) {
    return toErrorResponse(error, "Gagal menyimpan tagihan");
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance"]);
    const { id } = await params;
    const invoiceId = ensurePositiveInt(id, "invoice id");
    await ensureInvoiceCanBeDeleted(invoiceId);
    await db.transaction(async (tx) => {
      await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
      await tx.delete(invoices).where(eq(invoices.id, invoiceId));
    });
    await deleteInvoiceJournal(invoiceId);
    await audit({ userId: user.id, action: "invoice.delete", entity: "invoice", entityId: invoiceId });
    return NextResponse.json({ ok: true, data: await getInvoices() });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete invoice");
  }
}
