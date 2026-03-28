import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { getPayments } from "@/lib/data";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const paymentId = Number(id);
    const body = await request.json();

    await db
      .update(payments)
      .set({
        invoiceId: Number(body.invoiceId),
        clientId: Number(body.clientId),
        amount: Number(body.amount ?? 0),
        paymentMethod: String(body.paymentMethod ?? "").trim() || null,
        referenceCode: String(body.referenceCode ?? "").trim() || null,
      })
      .where(eq(payments.id, paymentId));

    return NextResponse.json({ ok: true, data: await getPayments() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update payment" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(payments).where(eq(payments.id, Number(id)));
    return NextResponse.json({ ok: true, data: await getPayments() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete payment" },
      { status: 500 },
    );
  }
}
