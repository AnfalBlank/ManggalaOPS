import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { quotationItems, quotations } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getQuotations } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { computeOutputTax, normalizeTaxPercent } from "@/lib/output-tax";

export async function GET() {
  try {
    await requireRole(["admin", "finance", "sales", "project_manager"]);
    const data = await getQuotations();
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch quotations");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "sales"]);
    const body = await request.json();
    const clientId = ensurePositiveInt(body.clientId, "clientId");
    const items = (Array.isArray(body.items) ? body.items : []) as Array<{ description?: string; qty?: number | string; unit?: string; unitPrice?: number | string; unitCost?: number | string; amount?: number | string; imageUrl?: string | null }>;
    ensure(items.length > 0, "Minimal satu item quotation");
    const subtotal = items.reduce((sum: number, item) => sum + parseMoneyInput(item.amount), 0);
    ensure(subtotal > 0, "Subtotal quotation harus lebih besar dari 0");

    const subtotalCost = items.reduce((sum: number, item) => {
      const cost = parseMoneyInput(item.unitCost ?? 0);
      return sum + (cost * Number(item.qty ?? 0));
    }, 0);
    const totalMargin = subtotal - subtotalCost;
    const marginPercentage = subtotal > 0 ? (totalMargin / subtotal) * 100 : 0;

    const { tax, total } = computeOutputTax(subtotal, normalizeTaxPercent(body.taxPercent, 11));

    const quotationId = await db.transaction(async (tx) => {
      const inserted = await tx.insert(quotations).values({
        clientId,
        projectId: body.projectId ? ensurePositiveInt(body.projectId, "projectId") : null,
        date: new Date(),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
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
        subtotalCost,
        totalMargin,
        marginPercentage,
        status: trimString(body.status, 50) || "Draft",
      }).returning({ id: quotations.id });

      const newId = inserted[0]?.id;
      if (!newId) throw new Error("Failed to insert quotation");

      await tx.insert(quotationItems).values(items.map((item) => ({
        quotationId: newId,
        description: trimString(item.description, 1000),
        qty: Math.max(1, Number(item.qty ?? 0) || 1),
        unit: trimString(item.unit, 50) || "Unit",
        unitPrice: parseMoneyInput(item.unitPrice),
        unitCost: parseMoneyInput(item.unitCost ?? 0),
        amount: parseMoneyInput(item.amount),
        imageUrl: item.imageUrl ? trimString(item.imageUrl, 500) : null,
      })));

      return newId;
    });

    await audit({ userId: user.id, action: "quotation.create", entity: "quotation", entityId: quotationId, payload: { clientId, total } });
    return NextResponse.json({ ok: true, data: await getQuotations() });
  } catch (error) {
    return toErrorResponse(error, "Failed to create quotation");
  }
}
