import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { getProjects } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projectId = Number(id);
    const body = await request.json();

    await db.update(projects).set({
      clientId: Number(body.clientId),
      name: String(body.name ?? "").trim(),
      value: parseMoneyInput(body.value),
      status: String(body.status ?? "In Progress").trim() || "In Progress",
      progress: Number(body.progress ?? 0),
      deadline: body.deadline ? new Date(body.deadline) : null,
    }).where(eq(projects.id, projectId));

    return NextResponse.json({ ok: true, data: await getProjects() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(projects).where(eq(projects.id, Number(id)));
    return NextResponse.json({ ok: true, data: await getProjects() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete project" }, { status: 500 });
  }
}
