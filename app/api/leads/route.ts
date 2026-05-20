import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { leads } from "@/db/schema";
import { ensure, ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getLeads } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";

export async function GET() {
  try {
    await requireRole(["admin", "finance", "sales", "project_manager"]);
    const data = await getLeads();
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch leads");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "sales"]);
    const body = await request.json();
    const clientId = ensurePositiveInt(body.clientId, "clientId");
    const serviceName = trimString(body.serviceName, 500);
    ensure(serviceName.length > 0, "serviceName wajib diisi");
    const status = trimString(body.status, 50) || "New";

    const inserted = await db.insert(leads).values({
      clientId,
      serviceName,
      estimatedValue: parseMoneyInput(body.estimatedValue),
      status,
      createdAt: new Date(),
    }).returning({ id: leads.id });

    await audit({ userId: user.id, action: "lead.create", entity: "lead", entityId: inserted[0]?.id, payload: { serviceName, status } });
    return NextResponse.json({ ok: true, data: await getLeads() });
  } catch (error) {
    return toErrorResponse(error, "Failed to create lead");
  }
}
