import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { accounts, expenses, journalEntries, journals, users } from "@/db/schema";
import { getFinanceSummary } from "@/lib/business";

export async function getFinanceOverviewData() {
  const [summary, recentExpenses] = await Promise.all([
    getFinanceSummary(),
    db.select().from(expenses).orderBy(desc(expenses.id)).limit(20),
  ]);

  return {
    ...summary,
    recentExpenses,
  };
}

export async function getAccountingOverviewData() {
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
      .orderBy(accounts.code),
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
      .orderBy(desc(journals.id), journalEntries.id),
  ]);

  return {
    accounts: accountRows,
    entries: journalRows,
  };
}

export async function getUsersData() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.id));
}
