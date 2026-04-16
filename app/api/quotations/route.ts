import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { quotationItems, quotations } from "@/db/schema";
import { getQuotations } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { computeOutputTax, normalizeTaxPercent } from "@/lib/output-tax";

export async function GET() {
  try {
    const data = await getQuotations();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch quotations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId = Number(body.clientId);
    const items = (Array.isArray(body.items) ? body.items : []) as Array<{ description?: string; qty?: number | string; unit?: string; unitPrice?: number | string; unitCost?: number | string; amount?: number | string; imageUrl?: string | null }>;
    const subtotal = items.reduce((sum: number, item) => sum + parseMoneyInput(item.amount), 0);

    const subtotalCost = items.reduce((sum: number, item) => {
      const cost = parseMoneyInput(item.unitCost ?? 0);
      return sum + (cost * Number(item.qty ?? 0));
    }, 0);
    const totalMargin = subtotal - subtotalCost;
    const marginPercentage = subtotal > 0 ? (totalMargin / subtotal) * 100 : 0;

    const { tax, total } = computeOutputTax(subtotal, normalizeTaxPercent(body.taxPercent, 11));

    if (!clientId || total <= 0 || items.length === 0) {
      return NextResponse.json({ error: "clientId, items, dan total wajib diisi" }, { status: 400 });
    }

    const inserted = await db.insert(quotations).values({
      clientId,
      projectId: body.projectId ? Number(body.projectId) : null,
      date: new Date(),
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
    }).returning({ id: quotations.id });

    const quotationId = inserted[0]?.id;
    if (quotationId) {
      await db.insert(quotationItems).values(items.map((item) => ({
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

    return NextResponse.json({ ok: true, data: await getQuotations() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create quotation" }, { status: 500 });
  }
}
