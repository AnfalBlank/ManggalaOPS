import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { quotations } from "@/db/schema";
import { ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";

const VALID_STATUSES = ["Draft", "Sent", "Accepted", "Rejected"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireRole(["admin", "sales"]);
    const { id } = await params;
    const quotationId = ensurePositiveInt(id, "quotation id");
    const body = await request.json();
    const status = trimString(body.status, 50);
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Status tidak dikenal" }, { status: 400 });
    }

    await db.update(quotations).set({ status }).where(eq(quotations.id, quotationId));
    await audit({ userId: user.id, action: "quotation.status_change", entity: "quotation", entityId: quotationId, payload: { status } });
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return toErrorResponse(error, "Gagal mengubah status penawaran");
  }
}
