import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { quotationItems, quotations } from "@/db/schema";
import { getQuotations } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quotationId = Number(id);
    const body = await request.json();
    const items = (Array.isArray(body.items) ? body.items : []) as Array<{ description?: string; qty?: number | string; unit?: string; unitPrice?: number | string; amount?: number | string }>;
    const subtotal = items.reduce((sum: number, item) => sum + parseMoneyInput(item.amount), 0);
    const taxPercent = Math.max(Number(body.taxPercent ?? 0) || 0, 0);
    const tax = Math.round((subtotal * taxPercent) / 100);
    const total = subtotal + tax;

    await db.update(quotations).set({
      clientId: Number(body.clientId),
      projectId: body.projectId ? Number(body.projectId) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
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
      status: String(body.status ?? "Draft").trim() || "Draft",
    }).where(eq(quotations.id, quotationId));

    await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
    if (items.length > 0) {
      await db.insert(quotationItems).values(items.map((item) => ({
        quotationId,
        description: String(item.description ?? "").trim(),
        qty: Number(item.qty ?? 0),
        unit: String(item.unit ?? "Unit").trim() || "Unit",
        unitPrice: parseMoneyInput(item.unitPrice),
        amount: parseMoneyInput(item.amount),
      })));
    }

    return NextResponse.json({ ok: true, data: await getQuotations() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update quotation" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quotationId = Number(id);
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
    await db.delete(quotations).where(eq(quotations.id, quotationId));
    return NextResponse.json({ ok: true, data: await getQuotations() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete quotation" }, { status: 500 });
  }
}
