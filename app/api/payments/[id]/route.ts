import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { deletePaymentJournal, upsertPaymentJournal } from "@/lib/business";
import { getPayments } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { ensurePaymentMatchesInvoice } from "@/lib/validators";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const paymentId = Number(id);
    const body = await request.json();
    const invoiceId = Number(body.invoiceId);
    const clientId = Number(body.clientId);
    const amount = parseMoneyInput(body.amount);

    await ensurePaymentMatchesInvoice({
      invoiceId,
      clientId,
      amount,
      excludePaymentId: paymentId,
    });

    await db
      .update(payments)
      .set({
        invoiceId,
        clientId,
        amount,
        paymentMethod: String(body.paymentMethod ?? "").trim() || null,
        paymentAccountCode: String(body.paymentAccountCode ?? "1002").trim() || "1002",
        referenceCode: String(body.referenceCode ?? "").trim() || null,
      })
      .where(eq(payments.id, paymentId));

    await upsertPaymentJournal(paymentId);

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
    const paymentId = Number(id);
    await deletePaymentJournal(paymentId);
    await db.delete(payments).where(eq(payments.id, paymentId));
    return NextResponse.json({ ok: true, data: await getPayments() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete payment" },
      { status: 500 },
    );
  }
}
