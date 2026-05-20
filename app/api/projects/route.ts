import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { ensure, ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getProjects } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";

export async function GET() {
  try {
    await requireRole(["admin", "finance", "sales", "project_manager"]);
    const data = await getProjects();
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch projects");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "sales", "project_manager"]);
    const body = await request.json();
    const clientId = ensurePositiveInt(body.clientId, "clientId");
    const name = trimString(body.name, 300);
    ensure(name.length > 0, "Nama project wajib diisi");

    const inserted = await db.insert(projects).values({
      clientId,
      name,
      value: parseMoneyInput(body.value),
      status: trimString(body.status, 50) || "In Progress",
      progress: Math.max(0, Math.min(100, Number(body.progress ?? 0) || 0)),
      startDate: new Date(),
      deadline: body.deadline ? new Date(body.deadline) : null,
    }).returning({ id: projects.id });

    await audit({ userId: user.id, action: "project.create", entity: "project", entityId: inserted[0]?.id, payload: { name } });
    return NextResponse.json({ ok: true, data: await getProjects() });
  } catch (error) {
    return toErrorResponse(error, "Failed to create project");
  }
}
