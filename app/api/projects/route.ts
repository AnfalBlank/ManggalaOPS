import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { getProjects } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";

export async function GET() {
  try {
    const data = await getProjects();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId = Number(body.clientId);
    const name = String(body.name ?? "").trim();

    if (!clientId || !name) {
      return NextResponse.json({ error: "clientId dan name wajib diisi" }, { status: 400 });
    }

    await db.insert(projects).values({
      clientId,
      name,
      value: parseMoneyInput(body.value),
      status: String(body.status ?? "In Progress").trim() || "In Progress",
      progress: Number(body.progress ?? 0),
      startDate: new Date(),
      deadline: body.deadline ? new Date(body.deadline) : null,
    });

    return NextResponse.json({ ok: true, data: await getProjects() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create project" }, { status: 500 });
  }
}
