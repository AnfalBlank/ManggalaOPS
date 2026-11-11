import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { ensure, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getClients } from "@/lib/data";

export async function GET() {
  try {
    await requireRole(["admin", "finance", "sales", "project_manager"]);
    const data = await getClients();
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Gagal ngambil data klien");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "sales"]);
    const body = await request.json();
    const name = trimString(body.name, 200);
    ensure(name.length > 0, "Nama klien wajib diisi");
    const semua = await db.select({ id: clients.id, name: clients.name }).from(clients);
    const kembar = semua.find((c) => c.name.trim().replace(/\s+/g, " ").toLowerCase() === name.replace(/\s+/g, " ").toLowerCase());
    ensure(!kembar, `Klien "${name}" udah ada di daftar klien. Pakai data yang udah ada.`);

    const inserted = await db.insert(clients).values({
      name,
      contactPerson: nullableTrim(body.contactPerson, 200),
      additionalPic: nullableTrim(body.additionalPic, 200),
      phone: nullableTrim(body.phone, 50),
      email: nullableTrim(body.email, 200),
      npwp: nullableTrim(body.npwp, 50),
      address: nullableTrim(body.address, 1000),
      notes: nullableTrim(body.notes, 2000),
    }).returning({ id: clients.id });

    await audit({ userId: user.id, action: "client.create", entity: "client", entityId: inserted[0]?.id, payload: { name } });
    return NextResponse.json({ ok: true, data: await getClients() });
  } catch (error) {
    return toErrorResponse(error, "Gagal nambah klien");
  }
}
