import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { leads } from "@/db/schema";
import { ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";

const VALID_STATUSES = ["New", "Follow Up", "Negotiation", "Won", "Lost"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireRole(["admin", "sales"]);
    const { id } = await params;
    const leadId = ensurePositiveInt(id, "lead id");
    const body = await request.json();
    const status = trimString(body.status, 50);
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Status tidak valid. Pilih: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    await db.update(leads).set({ status }).where(eq(leads.id, leadId));
    await audit({ userId: user.id, action: "lead.status_change", entity: "lead", entityId: leadId, payload: { status } });
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return toErrorResponse(error, "Gagal ubah status calon klien");
  }
}
