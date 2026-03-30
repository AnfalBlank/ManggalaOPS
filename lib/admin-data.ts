import { desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { accounts, expenses, journalEntries, journals, users } from "@/db/schema";
import { getFinanceSummary } from "@/lib/business";
import { getAccountMapping } from "@/lib/account-mapping";

export async function getFinanceOverviewData() {
  const mapping = await getAccountMapping();
  const paymentAccountCodes = [mapping.cash, mapping.bankMandiri, mapping.bankBca];

  const [summary, recentExpenses, accountRows, projectRows] = await Promise.all([
    getFinanceSummary(),
    db
      .select({
        id: expenses.id,
        date: expenses.date,
        category: expenses.category,
        description: expenses.description,
        amount: expenses.amount,
        taxMode: expenses.taxMode,
        taxPercent: expenses.taxPercent,
        taxAmount: expenses.taxAmount,
        baseAmount: expenses.baseAmount,
        status: expenses.status,
        projectId: expenses.projectId,
        paymentAccountCode: expenses.paymentAccountCode,
        paymentAccountName: accounts.name,
      })
      .from(expenses)
      .leftJoin(accounts, eq(expenses.paymentAccountCode, accounts.code))
      .orderBy(desc(expenses.id))
      .limit(20),
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
    db.select({ id: sql<number>`${sql.raw('projects.id')}`.as('id'), name: sql<string>`${sql.raw('projects.name')}`.as('name'), clientId: sql<number>`${sql.raw('projects.client_id')}`.as('clientId'), clientName: sql<string>`${sql.raw('clients.name')}`.as('clientName') }).from(sql.raw('projects')).leftJoin(sql.raw('clients'), sql.raw('projects.client_id = clients.id')),
  ]);

  return {
    ...summary,
    recentExpenses,
    paymentAccounts: accountRows.filter((account) => account.type === "Asset" && paymentAccountCodes.includes(account.code)),
    projects: projectRows,
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
        accountName: accounts.name,
        debit: journalEntries.debit,
        credit: journalEntries.credit,
      })
      .from(journals)
      .innerJoin(journalEntries, eq(journals.id, journalEntries.journalId))
      .leftJoin(accounts, eq(accounts.code, journalEntries.accountCode))
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
