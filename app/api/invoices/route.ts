import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { getInvoices } from "@/lib/data";

export async function GET() {
  try {
    const data = await getInvoices();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId = Number(body.clientId);
    const projectId = body.projectId ? Number(body.projectId) : null;
    const quotationId = body.quotationId ? Number(body.quotationId) : null;
    const subtotal = Number(body.subtotal ?? 0);
    const tax = Number(body.tax ?? 0);
    const total = Number(body.total ?? subtotal + tax);
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;

    if (!clientId || subtotal <= 0) {
      return NextResponse.json(
        { error: "clientId and subtotal are required" },
        { status: 400 },
      );
    }

    await db.insert(invoices).values({
      clientId,
      projectId,
      quotationId,
      date: new Date(),
      dueDate,
      subtotal,
      tax,
      total,
      status: "Unpaid",
    });

    const data = await getInvoices();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invoice" },
      { status: 500 },
    );
  }
}
