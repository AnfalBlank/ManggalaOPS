import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, officeLocations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session-auth";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { latitude, longitude, photo } = body;

    if (latitude == null || longitude == null) {
      return NextResponse.json({ error: "Lokasi GPS diperlukan" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);

    const existing = await db.query.attendance.findFirst({
      where: and(eq(attendance.userId, user.id), eq(attendance.date, today)),
    });
    if (!existing?.clockIn) {
      return NextResponse.json({ error: "Anda belum absen masuk hari ini" }, { status: 400 });
    }
    if (existing.clockOut) {
      return NextResponse.json({ error: "Anda sudah absen keluar hari ini" }, { status: 400 });
    }

    // Find nearest office
    const offices = await db.query.officeLocations.findMany({
      where: eq(officeLocations.isActive, true),
    });

    let nearestOffice = null;
    let nearestDistance = Infinity;

    for (const office of offices) {
      const dist = haversine(latitude, longitude, office.latitude, office.longitude);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestOffice = office;
      }
    }

    const now = new Date();

    await db.update(attendance)
      .set({
        clockOut: now,
        clockOutLatitude: latitude,
        clockOutLongitude: longitude,
        clockOutPhoto: photo || null,
        clockOutLocationId: nearestOffice?.id ?? null,
        clockOutDistance: nearestDistance,
      })
      .where(eq(attendance.id, existing.id));

    return NextResponse.json({
      ok: true,
      distance: Math.round(nearestDistance),
      officeName: nearestOffice?.name ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal absen keluar" },
      { status: 500 }
    );
  }
}
