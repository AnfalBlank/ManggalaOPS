import { NextResponse } from "next/server";
import { asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { accounts, journalEntries, journals } from "@/db/schema";

export async function GET() {
  try {
    const [accountRows, journalRows] = await Promise.all([
      db
        .select({
          code: accounts.code,
          name: accounts.name,
          type: accounts.type,
          balance: sql<number>`coalesce(sum(${journalEntries.debit}) - sum(${journalEntries.credit}), 0)`.as("balance"),
        })
        .from(accounts)
        .leftJoin(journalEntries, eq(accounts.code, journalEntries.accountCode))
        .groupBy(accounts.code, accounts.name, accounts.type)
        .orderBy(asc(accounts.code)),
      db
        .select({
          id: journals.id,
          date: journals.date,
          description: journals.description,
          accountCode: journalEntries.accountCode,
          debit: journalEntries.debit,
          credit: journalEntries.credit,
        })
        .from(journals)
        .innerJoin(journalEntries, eq(journals.id, journalEntries.journalId))
        .orderBy(desc(journals.id), asc(journalEntries.id)),
    ]);

    return NextResponse.json({ accounts: accountRows, entries: journalRows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch accounting overview" },
      { status: 500 },
    );
  }
}
