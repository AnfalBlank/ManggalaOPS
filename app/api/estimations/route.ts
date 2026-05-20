import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { estimations } from "@/db/schema";
import { ensure, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["admin", "finance", "sales", "project_manager"]);
    const data = await db.select().from(estimations).orderBy(desc(estimations.createdAt));
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch estimations");
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requireRole(["admin", "finance", "sales", "project_manager"]);
    const body = await req.json();
    const name = trimString(body.name, 200);
    ensure(name.length > 0, "Nama estimasi wajib diisi");

    const [newEstimation] = await db.insert(estimations).values({
      name,
      buyPrice: Number(body.buyPrice) || 0,
      sellPrice: Number(body.sellPrice) || 0,
      qty: Number(body.qty) || 1,
      buyIncludePpn: Boolean(body.buyIncludePpn),
      sellIncludePpn: Boolean(body.sellIncludePpn),
      ppnRate: Number(body.ppnRate) || 0,
      createdAt: new Date(),
    }).returning();

    await audit({ userId: user.id, action: "estimation.create", entity: "estimation", entityId: newEstimation?.id, payload: { name } });
    return NextResponse.json(newEstimation, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to save estimation");
  }
}
