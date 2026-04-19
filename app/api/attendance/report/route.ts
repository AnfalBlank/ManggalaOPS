import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || String(new Date().getMonth() + 1);
    const year = searchParams.get("year") || String(new Date().getFullYear());
    const userId = searchParams.get("userId");

    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endMonth = month === "12" ? "01" : String(Number(month) + 1).padStart(2, "0");
    const endYear = month === "12" ? String(Number(year) + 1) : year;
    const endDate = `${endYear}-${endMonth}-01`;

    const conditions = [
      gte(attendance.date, startDate),
      lte(attendance.date, sql`${endDate}`),
    ];
    if (userId) conditions.push(eq(attendance.userId, Number(userId)));

    const records = await db.query.attendance.findMany({
      where: and(...conditions),
      orderBy: [sql`${attendance.date} DESC`],
      with: { user: { columns: { id: true, name: true, email: true } } },
    });

    // Summary stats
    const totalDays = records.length;
    const presentDays = records.filter((r: any) => r.status === "present").length;
    const lateDays = records.filter((r: any) => r.status === "late").length;

    return NextResponse.json({
      records,
      summary: { totalDays, presentDays, lateDays },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat laporan" },
      { status: 500 }
    );
  }
}
