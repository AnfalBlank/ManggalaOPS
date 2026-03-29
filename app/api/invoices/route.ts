import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";
import { upsertInvoiceJournal } from "@/lib/business";
import { getInvoices } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const data = await getInvoices();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId = Number(body.clientId);
    const items = (Array.isArray(body.items) ? body.items : []) as Array<{ description?: string; qty?: number | string; unit?: string; unitPrice?: number | string; amount?: number | string }>;
    const subtotal = items.reduce((sum: number, item) => sum + parseMoneyInput(item.amount), 0);
    const tax = parseMoneyInput(body.tax);
    const total = subtotal + tax;
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;

    if (!clientId || items.length === 0 || subtotal <= 0) {
      return NextResponse.json(
        { error: "clientId, items, dan subtotal wajib diisi" },
        { status: 400 },
      );
    }

    const inserted = await db.insert(invoices).values({
      clientId,
      projectId: body.projectId ? Number(body.projectId) : null,
      quotationId: body.quotationId ? Number(body.quotationId) : null,
      date: new Date(),
      dueDate,
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
      status: "Unpaid",
    }).returning({ id: invoices.id });

    const invoiceId = inserted[0]?.id;
    if (invoiceId) {
      await db.insert(invoiceItems).values(items.map((item) => ({
        invoiceId,
        description: String(item.description ?? "").trim(),
        qty: Number(item.qty ?? 0),
        unit: String(item.unit ?? "Unit").trim() || "Unit",
        unitPrice: parseMoneyInput(item.unitPrice),
        amount: parseMoneyInput(item.amount),
      })));
      await upsertInvoiceJournal(invoiceId);
      await createNotification({ title: "Invoice baru dibuat", message: `Invoice #${invoiceId} berhasil dibuat dengan total ${total.toLocaleString('id-ID')}.`, type: "info", targetRole: "finance" });
    }

    const data = await getInvoices();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invoice" },
      { status: 500 },
    );
  }
}
