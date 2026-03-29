import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getClients } from "@/lib/data";

export async function GET() {
  try {
    const data = await getClients();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch clients" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin", "sales"]);
    const body = await request.json();

    await db.insert(clients).values({
      name: String(body.name ?? "").trim(),
      contactPerson: String(body.contactPerson ?? "").trim() || null,
      additionalPic: String(body.additionalPic ?? "").trim() || null,
      phone: String(body.phone ?? "").trim() || null,
      email: String(body.email ?? "").trim() || null,
      npwp: String(body.npwp ?? "").trim() || null,
      address: String(body.address ?? "").trim() || null,
      notes: String(body.notes ?? "").trim() || null,
    });

    return NextResponse.json({ ok: true, data: await getClients() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create client" }, { status: 500 });
  }
}
