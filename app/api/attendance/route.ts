import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, users } from "@/db/schema";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const userId = searchParams.get("userId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const conditions = [];

    if (date) conditions.push(eq(attendance.date, date));
    if (userId) conditions.push(eq(attendance.userId, Number(userId)));
    if (month && year) {
      const startDate = `${year}-${month.padStart(2, "0")}-01`;
      const endMonth = month === "12" ? "01" : String(Number(month) + 1).padStart(2, "0");
      const endYear = month === "12" ? String(Number(year) + 1) : year;
      const endDate = `${endYear}-${endMonth}-01`;
      conditions.push(gte(attendance.date, startDate));
      conditions.push(lte(attendance.date, sql`${endDate}`));
    } else if (year) {
      conditions.push(gte(attendance.date, `${year}-01-01`));
      conditions.push(lte(attendance.date, `${year}-12-31`));
    }

    const records = await db.query.attendance.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(attendance.date), desc(attendance.clockIn)],
      with: { user: { columns: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil data absensi" },
      { status: 500 }
    );
  }
}
