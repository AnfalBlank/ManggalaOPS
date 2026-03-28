import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { getPayments } from "@/lib/data";

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
    const amount = Number(body.amount ?? 0);
    const paymentMethod = String(body.paymentMethod ?? "").trim() || null;
    const referenceCode = String(body.referenceCode ?? "").trim() || null;

    if (!invoiceId || !clientId || amount <= 0) {
      return NextResponse.json(
        { error: "invoiceId, clientId, and amount are required" },
        { status: 400 },
      );
    }

    await db.insert(payments).values({
      invoiceId,
      clientId,
      amount,
      paymentMethod,
      date: new Date(),
      referenceCode,
    });

    const data = await getPayments();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record payment" },
      { status: 500 },
    );
  }
}
