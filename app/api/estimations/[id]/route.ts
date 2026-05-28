import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { estimations } from "@/db/schema";
import { ensure, ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance", "sales", "project_manager"]);
    const { id } = await params;
    const estimationId = ensurePositiveInt(id, "estimation id");
    const body = await req.json();
    const name = trimString(body.name, 200);
    ensure(name.length > 0, "Nama estimasi wajib diisi");

    await db.update(estimations).set({
      name,
      buyPrice: Number(body.buyPrice) || 0,
      sellPrice: Number(body.sellPrice) || 0,
      qty: Number(body.qty) || 1,
      buyIncludePpn: Boolean(body.buyIncludePpn),
      sellIncludePpn: Boolean(body.sellIncludePpn),
      ppnRate: Number(body.ppnRate) || 0,
    }).where(eq(estimations.id, estimationId));

    await audit({ userId: user.id, action: "estimation.update", entity: "estimation", entityId: estimationId, payload: { name } });
    const [updated] = await db.select().from(estimations).where(eq(estimations.id, estimationId));
    return NextResponse.json(updated);
  } catch (error) {
    return toErrorResponse(error, "Failed to update estimation");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance", "sales", "project_manager"]);
    const { id } = await params;
    const estimationId = ensurePositiveInt(id, "estimation id");
    await db.delete(estimations).where(eq(estimations.id, estimationId));
    await audit({ userId: user.id, action: "estimation.delete", entity: "estimation", entityId: estimationId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete estimation");
  }
}
