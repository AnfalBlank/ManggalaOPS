import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getClients } from "@/lib/data";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin", "sales"]);
    const { id } = await params;
    const clientId = Number(id);
    const body = await request.json();

    await db.update(clients).set({
      name: String(body.name ?? "").trim(),
      contactPerson: String(body.contactPerson ?? "").trim() || null,
      additionalPic: String(body.additionalPic ?? "").trim() || null,
      phone: String(body.phone ?? "").trim() || null,
      email: String(body.email ?? "").trim() || null,
      npwp: String(body.npwp ?? "").trim() || null,
      address: String(body.address ?? "").trim() || null,
      notes: String(body.notes ?? "").trim() || null,
    }).where(eq(clients.id, clientId));

    return NextResponse.json({ ok: true, data: await getClients() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    await db.delete(clients).where(eq(clients.id, Number(id)));
    return NextResponse.json({ ok: true, data: await getClients() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete client" }, { status: 500 });
  }
}
