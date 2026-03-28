import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { getInvoices } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { ensureInvoiceCanBeDeleted, ensureInvoiceCanBeUpdated } from "@/lib/validators";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceId = Number(id);
    const body = await request.json();

    const subtotal = parseMoneyInput(body.subtotal);
    const tax = parseMoneyInput(body.tax);
    const total = parseMoneyInput(body.total) || subtotal + tax;

    await ensureInvoiceCanBeUpdated(invoiceId, total);

    await db
      .update(invoices)
      .set({
        clientId: Number(body.clientId),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        subtotal,
        tax,
        total,
      })
      .where(eq(invoices.id, invoiceId));

    return NextResponse.json({ ok: true, data: await getInvoices() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update invoice" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceId = Number(id);
    await ensureInvoiceCanBeDeleted(invoiceId);
    await db.delete(invoices).where(eq(invoices.id, invoiceId));
    return NextResponse.json({ ok: true, data: await getInvoices() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete invoice" },
      { status: 500 },
    );
  }
}
