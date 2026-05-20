import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { estimations } from "@/db/schema";
import { ensurePositiveInt, toErrorResponse } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";

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
