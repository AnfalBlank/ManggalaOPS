import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session-auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date().toISOString().slice(0, 10);

    const record = await db.query.attendance.findFirst({
      where: and(eq(attendance.userId, user.id), eq(attendance.date, today)),
    });

    return NextResponse.json(record || null);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil data" },
      { status: 500 }
    );
  }
}
