import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { quotations } from "@/db/schema";
import { getQuotations } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quotationId = Number(id);
    const body = await request.json();
    const subtotal = parseMoneyInput(body.subtotal);
    const tax = parseMoneyInput(body.tax);
    const total = parseMoneyInput(body.total) || subtotal + tax;

    await db.update(quotations).set({
      clientId: Number(body.clientId),
      projectId: body.projectId ? Number(body.projectId) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      subtotal,
      tax,
      total,
      status: String(body.status ?? "Draft").trim() || "Draft",
    }).where(eq(quotations.id, quotationId));

    return NextResponse.json({ ok: true, data: await getQuotations() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update quotation" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(quotations).where(eq(quotations.id, Number(id)));
    return NextResponse.json({ ok: true, data: await getQuotations() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete quotation" }, { status: 500 });
  }
}
