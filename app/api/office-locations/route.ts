import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { officeLocations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const locations = await db.query.officeLocations.findMany({
      orderBy: (locs, { desc }) => [desc(locs.isActive)],
    });
    return NextResponse.json(locations);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil lokasi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin"]);
    const body = await request.json();

    const result = await db.insert(officeLocations).values({
      name: String(body.name ?? "").trim(),
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      radiusMeters: body.radiusMeters ? Number(body.radiusMeters) : 100,
      isActive: body.isActive !== false,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({ ok: true, data: result[0] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat lokasi" },
      { status: 500 }
    );
  }
}
