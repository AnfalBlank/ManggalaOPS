import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { getPayments } from "@/lib/data";
import { upsertPaymentJournal } from "@/lib/business";
import { parseMoneyInput } from "@/lib/money";
import { ensurePaymentMatchesInvoice } from "@/lib/validators";

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
      date: new Date(),
      referenceCode,
    }).returning({ id: payments.id });

    if (inserted[0]?.id) {
      await upsertPaymentJournal(inserted[0].id);
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
