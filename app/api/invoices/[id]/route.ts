import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { deleteInvoiceJournal, upsertInvoiceJournal } from "@/lib/business";
import { getInvoices } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { ensureInvoiceCanBeDeleted, ensureInvoiceCanBeUpdated } from "@/lib/validators";
import { computeOutputTax, normalizeTaxPercent } from "@/lib/output-tax";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceId = Number(id);
    const body = await request.json();
    const items = (Array.isArray(body.items) ? body.items : []) as Array<{ description?: string; qty?: number | string; unit?: string; unitPrice?: number | string; amount?: number | string }>;
    const subtotal = items.reduce((sum: number, item) => sum + parseMoneyInput(item.amount), 0);
    const { tax, total } = computeOutputTax(subtotal, normalizeTaxPercent(body.taxPercent, 11));

    await ensureInvoiceCanBeUpdated(invoiceId, total);

    await db
      .update(invoices)
      .set({
        clientId: Number(body.clientId),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        paymentMethod: String(body.paymentMethod ?? "CBD").trim() || "CBD",
        attachment: String(body.attachment ?? "").trim() || null,
        subject: String(body.subject ?? "").trim() || null,
        recipientName: String(body.recipientName ?? "").trim() || null,
        recipientCompany: String(body.recipientCompany ?? "").trim() || null,
        recipientAddress: String(body.recipientAddress ?? "").trim() || null,
        introduction: String(body.introduction ?? "").trim() || null,
        terms: String(body.terms ?? "").trim() || null,
        closingNote: String(body.closingNote ?? "").trim() || null,
        signatoryName: String(body.signatoryName ?? "").trim() || null,
        signatoryTitle: String(body.signatoryTitle ?? "").trim() || null,
        subtotal,
        tax,
        total,
      })
      .where(eq(invoices.id, invoiceId));

    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    if (items.length > 0) {
      await db.insert(invoiceItems).values(items.map((item) => ({
        invoiceId,
        description: String(item.description ?? "").trim(),
        qty: Number(item.qty ?? 0),
        unit: String(item.unit ?? "Unit").trim() || "Unit",
        unitPrice: parseMoneyInput(item.unitPrice),
        amount: parseMoneyInput(item.amount),
      })));
    }

    await upsertInvoiceJournal(invoiceId);

    return NextResponse.json({ ok: true, data: await getInvoices() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update invoice" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceId = Number(id);
    await ensureInvoiceCanBeDeleted(invoiceId);
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    await deleteInvoiceJournal(invoiceId);
    await db.delete(invoices).where(eq(invoices.id, invoiceId));
    return NextResponse.json({ ok: true, data: await getInvoices() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete invoice" },
      { status: 500 },
    );
  }
}
