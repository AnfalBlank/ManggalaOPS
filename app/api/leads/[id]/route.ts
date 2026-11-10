import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { leads } from "@/db/schema";
import { ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getLeads } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { ensureLeadCanBeDeleted } from "@/lib/validators";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales"]);
    const { id } = await params;
    const leadId = ensurePositiveInt(id, "lead id");
    const body = await request.json();

    await db
      .update(leads)
      .set({
        clientId: ensurePositiveInt(body.clientId, "clientId"),
        serviceName: trimString(body.serviceName, 500),
        estimatedValue: parseMoneyInput(body.estimatedValue),
        status: trimString(body.status, 50) || "New",
      })
      .where(eq(leads.id, leadId));

    await audit({ userId: user.id, action: "lead.update", entity: "lead", entityId: leadId });
    return NextResponse.json({ ok: true, data: await getLeads() });
  } catch (error) {
    return toErrorResponse(error, "Gagal nyimpen calon klien");
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales"]);
    const { id } = await params;
    const leadId = ensurePositiveInt(id, "lead id");
    await ensureLeadCanBeDeleted(leadId);
    await db.delete(leads).where(eq(leads.id, leadId));
    await audit({ userId: user.id, action: "lead.delete", entity: "lead", entityId: leadId });
    return NextResponse.json({ ok: true, data: await getLeads() });
  } catch (error) {
    return toErrorResponse(error, "Gagal hapus calon klien");
  }
}
