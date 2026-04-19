import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, officeLocations } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
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

    // Prevent double clock-in
    const existing = await db.query.attendance.findFirst({
      where: and(eq(attendance.userId, user.id), eq(attendance.date, today)),
    });
    if (existing?.clockIn) {
      return NextResponse.json({ error: "Anda sudah absen masuk hari ini" }, { status: 400 });
    }

    // Find nearest office & check geofence
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

    if (!nearestOffice) {
      return NextResponse.json({ error: "Tidak ada lokasi kantor yang aktif" }, { status: 400 });
    }

    if (nearestDistance > (nearestOffice.radiusMeters ?? 100)) {
      return NextResponse.json({
        error: `Di luar area kantor. Jarak ${Math.round(nearestDistance)}m dari ${nearestOffice.name}`,
      }, { status: 400 });
    }

    // Determine status: late if after 09:00 WIB (02:00 UTC)
    const now = new Date();
    const hourWIB = (now.getUTCHours() + 7) % 24;
    const minuteWIB = now.getUTCMinutes();
    const isLate = hourWIB > 9 || (hourWIB === 9 && minuteWIB > 0);

    await db.insert(attendance).values({
      userId: user.id,
      date: today,
      clockIn: now,
      clockInLatitude: latitude,
      clockInLongitude: longitude,
      clockInPhoto: photo || null,
      clockInLocationId: nearestOffice.id,
      clockInDistance: nearestDistance,
      status: isLate ? "late" : "present",
      createdAt: now,
    });

    return NextResponse.json({
      ok: true,
      status: isLate ? "late" : "present",
      distance: Math.round(nearestDistance),
      officeName: nearestOffice.name,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal absen masuk" },
      { status: 500 }
    );
  }
}
