import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { quotationItems, quotations } from "@/db/schema";
import { getQuotations } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { computeOutputTax, normalizeTaxPercent } from "@/lib/output-tax";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quotationId = Number(id);
    const body = await request.json();
    const items = (Array.isArray(body.items) ? body.items : []) as Array<{ description?: string; qty?: number | string; unit?: string; unitPrice?: number | string; unitCost?: number | string; amount?: number | string }>;
    const subtotal = items.reduce((sum: number, item) => sum + parseMoneyInput(item.amount), 0);

    const subtotalCost = items.reduce((sum: number, item) => {
      const cost = parseMoneyInput(item.unitCost ?? 0);
      return sum + (cost * Number(item.qty ?? 0));
    }, 0);
    const totalMargin = subtotal - subtotalCost;
    const marginPercentage = subtotal > 0 ? (totalMargin / subtotal) * 100 : 0;

    const { tax, total } = computeOutputTax(subtotal, normalizeTaxPercent(body.taxPercent, 11));

    await db.transaction(async (tx) => {
      await tx.update(quotations).set({
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
        subtotalCost,
        totalMargin,
        marginPercentage,
        status: String(body.status ?? "Draft").trim() || "Draft",
      }).where(eq(quotations.id, quotationId));

      await tx.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
      if (items.length > 0) {
        await tx.insert(quotationItems).values(items.map((item) => ({
          quotationId,
          description: String(item.description ?? "").trim(),
          qty: Number(item.qty ?? 0),
          unit: String(item.unit ?? "Unit").trim() || "Unit",
          unitPrice: parseMoneyInput(item.unitPrice),
          unitCost: parseMoneyInput(item.unitCost ?? 0),
          amount: parseMoneyInput(item.amount),
          imageUrl: item.imageUrl ? String(item.imageUrl).trim() : null,
        })));
      }
    });

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
