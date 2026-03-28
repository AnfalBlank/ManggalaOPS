import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { quotations } from "@/db/schema";
import { getQuotations } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";

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
    const subtotal = parseMoneyInput(body.subtotal);
    const tax = parseMoneyInput(body.tax);
    const total = parseMoneyInput(body.total) || subtotal + tax;

    if (!clientId || total <= 0) {
      return NextResponse.json({ error: "clientId dan total wajib diisi" }, { status: 400 });
    }

    await db.insert(quotations).values({
      clientId,
      projectId: body.projectId ? Number(body.projectId) : null,
      date: new Date(),
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      subtotal,
      tax,
      total,
      status: String(body.status ?? "Draft").trim() || "Draft",
    });

    return NextResponse.json({ ok: true, data: await getQuotations() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create quotation" }, { status: 500 });
  }
}
