import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { expenses } from "@/db/schema";
import { getFinanceSummary } from "@/lib/business";

export async function GET() {
  try {
    const [summary, recentExpenses] = await Promise.all([
      getFinanceSummary(),
      db.select().from(expenses).orderBy(desc(expenses.id)).limit(20),
    ]);

    return NextResponse.json({
      ...summary,
      recentExpenses,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch finance overview" },
      { status: 500 },
    );
  }
}
