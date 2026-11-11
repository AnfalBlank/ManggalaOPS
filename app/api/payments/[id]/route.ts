import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { deletePaymentJournal, upsertPaymentJournal } from "@/lib/business";
import { getPayments } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { ensurePaymentMatchesInvoice } from "@/lib/validators";
import { cekBayarTagihan } from "@/lib/cegah-dobel";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance"]);
    const { id } = await params;
    const paymentId = ensurePositiveInt(id, "payment id");
    const body = await request.json();
    const invoiceId = ensurePositiveInt(body.invoiceId, "invoiceId");
    const clientId = ensurePositiveInt(body.clientId, "clientId");
    const amount = parseMoneyInput(body.amount);
    ensure(amount > 0, "Nominal pembayaran harus lebih dari 0");

    await ensurePaymentMatchesInvoice({
      invoiceId,
      clientId,
      amount,
      excludePaymentId: paymentId,
    });

    await db.transaction(async (tx) => {
      await tx
      .update(payments)
      .set({
        invoiceId,
        clientId,
        amount,
        paymentMethod: nullableTrim(body.paymentMethod, 100),
        paymentAccountCode: trimString(body.paymentAccountCode, 50) || "1002",
        referenceCode: nullableTrim(body.referenceCode, 200),
      })
      .where(eq(payments.id, paymentId));
      await cekBayarTagihan(tx, invoiceId);
    });

    await upsertPaymentJournal(paymentId);
    await audit({ userId: user.id, action: "payment.update", entity: "payment", entityId: paymentId });

    return NextResponse.json({ ok: true, data: await getPayments() });
  } catch (error) {
    return toErrorResponse(error, "Gagal menyimpan pembayaran");
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance"]);
    const { id } = await params;
    const paymentId = ensurePositiveInt(id, "payment id");
    await deletePaymentJournal(paymentId);
    await db.delete(payments).where(eq(payments.id, paymentId));
    await audit({ userId: user.id, action: "payment.delete", entity: "payment", entityId: paymentId });
    return NextResponse.json({ ok: true, data: await getPayments() });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete payment");
  }
}
