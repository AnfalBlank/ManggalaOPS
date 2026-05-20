import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getClients } from "@/lib/data";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales"]);
    const { id } = await params;
    const clientId = ensurePositiveInt(id, "client id");
    const body = await request.json();
    const name = trimString(body.name, 200);
    ensure(name.length > 0, "Nama client wajib diisi");

    await db.update(clients).set({
      name,
      contactPerson: nullableTrim(body.contactPerson, 200),
      additionalPic: nullableTrim(body.additionalPic, 200),
      phone: nullableTrim(body.phone, 50),
      email: nullableTrim(body.email, 200),
      npwp: nullableTrim(body.npwp, 50),
      address: nullableTrim(body.address, 1000),
      notes: nullableTrim(body.notes, 2000),
    }).where(eq(clients.id, clientId));

    await audit({ userId: user.id, action: "client.update", entity: "client", entityId: clientId, payload: { name } });
    return NextResponse.json({ ok: true, data: await getClients() });
  } catch (error) {
    return toErrorResponse(error, "Failed to update client");
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin"]);
    const { id } = await params;
    const clientId = ensurePositiveInt(id, "client id");
    await db.delete(clients).where(eq(clients.id, clientId));
    await audit({ userId: user.id, action: "client.delete", entity: "client", entityId: clientId });
    return NextResponse.json({ ok: true, data: await getClients() });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete client");
  }
}
