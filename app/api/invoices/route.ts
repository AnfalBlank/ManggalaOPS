import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { upsertInvoiceJournal } from "@/lib/business";
import { getInvoices } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { createNotification } from "@/lib/notifications";
import { computeOutputTax, normalizeTaxPercent } from "@/lib/output-tax";

export async function GET() {
  try {
    await requireRole(["admin", "finance", "sales", "project_manager"]);
    const data = await getInvoices();
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch invoices");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "finance", "sales"]);
    const body = await request.json();
    const clientId = ensurePositiveInt(body.clientId, "clientId");
    const items = (Array.isArray(body.items) ? body.items : []) as Array<{ description?: string; qty?: number | string; unit?: string; unitPrice?: number | string; amount?: number | string }>;
    ensure(items.length > 0, "Minimal satu item invoice");
    const subtotal = items.reduce((sum: number, item) => sum + parseMoneyInput(item.amount), 0);
    ensure(subtotal > 0, "Subtotal invoice harus lebih besar dari 0");
    const { tax, total } = computeOutputTax(subtotal, normalizeTaxPercent(body.taxPercent, 11));
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const invoiceId = await db.transaction(async (tx) => {
      const inserted = await tx.insert(invoices).values({
        clientId,
        projectId: body.projectId ? ensurePositiveInt(body.projectId, "projectId") : null,
        quotationId: body.quotationId ? ensurePositiveInt(body.quotationId, "quotationId") : null,
        date: new Date(),
        dueDate,
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
        status: "Unpaid",
      }).returning({ id: invoices.id });

      const newId = inserted[0]?.id;
      if (!newId) throw new Error("Gagal membuat invoice");

      await tx.insert(invoiceItems).values(items.map((item) => ({
        invoiceId: newId,
        description: trimString(item.description, 1000),
        qty: Math.max(1, Number(item.qty ?? 0) || 1),
        unit: trimString(item.unit, 50) || "Unit",
        unitPrice: parseMoneyInput(item.unitPrice),
        amount: parseMoneyInput(item.amount),
      })));

      return newId;
    });

    await upsertInvoiceJournal(invoiceId);
    await createNotification({ title: "Invoice baru dibuat", message: `Invoice #${invoiceId} berhasil dibuat dengan total ${total.toLocaleString('id-ID')}.`, type: "info", targetRole: "finance" });
    await audit({ userId: user.id, action: "invoice.create", entity: "invoice", entityId: invoiceId, payload: { clientId, total } });

    return NextResponse.json({ ok: true, data: await getInvoices() });
  } catch (error) {
    return toErrorResponse(error, "Failed to create invoice");
  }
}
