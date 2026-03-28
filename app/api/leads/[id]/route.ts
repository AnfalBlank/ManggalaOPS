import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { leads } from "@/db/schema";
import { getLeads } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { ensureLeadCanBeDeleted } from "@/lib/validators";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const leadId = Number(id);
    const body = await request.json();

    await db
      .update(leads)
      .set({
        clientId: Number(body.clientId),
        serviceName: String(body.serviceName ?? "").trim(),
        estimatedValue: parseMoneyInput(body.estimatedValue),
        status: String(body.status ?? "New").trim() || "New",
      })
      .where(eq(leads.id, leadId));

    return NextResponse.json({ ok: true, data: await getLeads() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update lead" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const leadId = Number(id);
    await ensureLeadCanBeDeleted(leadId);
    await db.delete(leads).where(eq(leads.id, leadId));
    return NextResponse.json({ ok: true, data: await getLeads() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete lead" },
      { status: 500 },
    );
  }
}
