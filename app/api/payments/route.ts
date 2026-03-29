import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { getPayments } from "@/lib/data";
import { upsertPaymentJournal } from "@/lib/business";
import { parseMoneyInput } from "@/lib/money";
import { ensurePaymentMatchesInvoice } from "@/lib/validators";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const data = await getPayments();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const invoiceId = Number(body.invoiceId);
    const clientId = Number(body.clientId);
    const amount = parseMoneyInput(body.amount);
    const paymentMethod = String(body.paymentMethod ?? "").trim() || null;
    const paymentAccountCode = String(body.paymentAccountCode ?? "1002").trim() || "1002";
    const referenceCode = String(body.referenceCode ?? "").trim() || null;

    if (!invoiceId || !clientId || amount <= 0) {
      return NextResponse.json(
        { error: "invoiceId, clientId, dan amount wajib diisi" },
        { status: 400 },
      );
    }

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
    }

    const data = await getPayments();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record payment" },
      { status: 500 },
    );
  }
}
