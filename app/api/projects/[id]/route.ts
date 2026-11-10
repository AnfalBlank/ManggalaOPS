import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getProjects } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales", "project_manager"]);
    const { id } = await params;
    const projectId = ensurePositiveInt(id, "project id");
    const body = await request.json();

    await db.update(projects).set({
      clientId: ensurePositiveInt(body.clientId, "clientId"),
      name: trimString(body.name, 300),
      value: parseMoneyInput(body.value),
      status: trimString(body.status, 50) || "In Progress",
      progress: Math.max(0, Math.min(100, Number(body.progress ?? 0) || 0)),
      deadline: body.deadline ? new Date(body.deadline) : null,
    }).where(eq(projects.id, projectId));

    await audit({ userId: user.id, action: "project.update", entity: "project", entityId: projectId });
    return NextResponse.json({ ok: true, data: await getProjects() });
  } catch (error) {
    return toErrorResponse(error, "Gagal simpan proyek");
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin"]);
    const { id } = await params;
    const projectId = ensurePositiveInt(id, "project id");
    await db.delete(projects).where(eq(projects.id, projectId));
    await audit({ userId: user.id, action: "project.delete", entity: "project", entityId: projectId });
    return NextResponse.json({ ok: true, data: await getProjects() });
  } catch (error) {
    return toErrorResponse(error, "Gagal hapus proyek");
  }
}
