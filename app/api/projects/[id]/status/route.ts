import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";

const VALID_STATUSES = ["In Progress", "Completed", "On Hold"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireRole(["admin", "sales", "project_manager"]);
    const { id } = await params;
    const projectId = ensurePositiveInt(id, "project id");
    const body = await request.json();
    const status = trimString(body.status, 50);
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Status tidak valid. Pilih: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    await db.update(projects).set({ status }).where(eq(projects.id, projectId));
    await audit({ userId: user.id, action: "project.status_change", entity: "project", entityId: projectId, payload: { status } });
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return toErrorResponse(error, "Failed to update project status");
  }
}
