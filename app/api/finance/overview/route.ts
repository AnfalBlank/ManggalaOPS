import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { expenses } from "@/db/schema";
import { toErrorResponse } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { getFinanceSummary } from "@/lib/business";

export async function GET() {
  try {
    await requireRole(["admin", "finance"]);
    const [summary, recentExpenses] = await Promise.all([
      getFinanceSummary(),
      db.select().from(expenses).orderBy(desc(expenses.id)).limit(20),
    ]);

    return NextResponse.json({ ...summary, recentExpenses });
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch finance overview");
  }
}
