import { and, eq, gte, lte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { accounts, journalEntries, journals } from "@/db/schema";
import { toErrorResponse } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin", "finance"]);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate dan endDate wajib diisi" }, { status: 400 });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
    }

    const [periodRows, cutoffRows] = await Promise.all([
      db
        .select({
          code: accounts.code,
          name: accounts.name,
          type: accounts.type,
          balance: sql<number>`coalesce(sum(${journalEntries.debit}) - sum(${journalEntries.credit}), 0)`.as("balance"),
        })
        .from(accounts)
        .leftJoin(journalEntries, eq(accounts.code, journalEntries.accountCode))
        .leftJoin(journals, eq(journals.id, journalEntries.journalId))
        .where(and(gte(journals.date, start), lte(journals.date, end)))
        .groupBy(accounts.code, accounts.name, accounts.type),
      db
        .select({
          code: accounts.code,
          name: accounts.name,
          type: accounts.type,
          balance: sql<number>`coalesce(sum(${journalEntries.debit}) - sum(${journalEntries.credit}), 0)`.as("balance"),
        })
        .from(accounts)
        .leftJoin(journalEntries, eq(accounts.code, journalEntries.accountCode))
        .leftJoin(journals, eq(journals.id, journalEntries.journalId))
        .where(lte(journals.date, end))
        .groupBy(accounts.code, accounts.name, accounts.type),
    ]);

    return NextResponse.json({ periodAccounts: periodRows, cutoffAccounts: cutoffRows, startDate, endDate });
  } catch (error) {
    return toErrorResponse(error, "Failed to build executive report");
  }
}
