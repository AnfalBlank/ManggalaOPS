import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { officeLocations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.latitude !== undefined) updates.latitude = Number(body.latitude);
    if (body.longitude !== undefined) updates.longitude = Number(body.longitude);
    if (body.radiusMeters !== undefined) updates.radiusMeters = Number(body.radiusMeters);
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);

    await db.update(officeLocations).set(updates).where(eq(officeLocations.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal update lokasi" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;

    await db.update(officeLocations).set({ isActive: false }).where(eq(officeLocations.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal hapus lokasi" },
      { status: 500 }
    );
  }
}
