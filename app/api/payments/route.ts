import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { upsertPaymentJournal } from "@/lib/business";
import { getPayments } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { createNotification } from "@/lib/notifications";
import { ensurePaymentMatchesInvoice } from "@/lib/validators";

export async function GET() {
  try {
    await requireRole(["admin", "finance"]);
    const data = await getPayments();
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch payments");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "finance"]);
    const body = await request.json();
    const invoiceId = ensurePositiveInt(body.invoiceId, "invoiceId");
    const clientId = ensurePositiveInt(body.clientId, "clientId");
    const amount = parseMoneyInput(body.amount);
    ensure(amount > 0, "Amount payment harus lebih besar dari 0");
    const paymentMethod = nullableTrim(body.paymentMethod, 100);
    const paymentAccountCode = trimString(body.paymentAccountCode, 50) || "1002";
    const referenceCode = nullableTrim(body.referenceCode, 200);

    await ensurePaymentMatchesInvoice({ invoiceId, clientId, amount });

    const inserted = await db.insert(payments).values({
      invoiceId,
      clientId,
      amount,
      paymentMethod,
      paymentAccountCode,
      date: new Date(),
      referenceCode,
    }).returning({ id: payments.id });

    if (inserted[0]?.id) {
      await upsertPaymentJournal(inserted[0].id);
      await createNotification({ title: "Payment baru tercatat", message: `Pembayaran invoice #${invoiceId} sebesar ${amount.toLocaleString('id-ID')} berhasil dicatat.`, type: "success", targetRole: "finance" });
      await audit({ userId: user.id, action: "payment.create", entity: "payment", entityId: inserted[0].id, payload: { invoiceId, amount } });
    }

    return NextResponse.json({ ok: true, data: await getPayments() });
  } catch (error) {
    return toErrorResponse(error, "Failed to record payment");
  }
}
