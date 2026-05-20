import { eq } from "drizzle-orm";

import { db } from "@/db";
import { expenses, journalEntries, journals } from "@/db/schema";
import { getAccountMapping } from "@/lib/account-mapping";

const VAT_INPUT_ACCOUNT_CODE = "1301";

export async function upsertExpenseJournal(expenseId: number) {
  const expense = await db.query.expenses.findFirst({ where: eq(expenses.id, expenseId) });
  if (!expense) throw new Error("Expense tidak ditemukan");

  const mapping = await getAccountMapping();
  const existingJournal = await db.query.journals.findFirst({
    where: eq(journals.referenceId, `expense:${expenseId}`),
  });

  let journalId = existingJournal?.id;

  if (!journalId) {
    const inserted = await db.insert(journals).values({
      date: expense.date,
      description: `Expense recorded #${expenseId}`,
      referenceId: `expense:${expenseId}`,
    }).returning({ id: journals.id });
    journalId = inserted[0]?.id;
  }

  if (!journalId) throw new Error("Gagal membuat jurnal expense");

  await db.delete(journalEntries).where(eq(journalEntries.journalId, journalId));

  const expenseAccountCode = expense.projectId ? mapping.projectExpense : mapping.operationalExpense;
  const journalRows = [
    { journalId, accountCode: expenseAccountCode, debit: expense.baseAmount ?? expense.amount, credit: 0 },
  ];

  if ((expense.taxAmount ?? 0) > 0) {
    journalRows.push({ journalId, accountCode: VAT_INPUT_ACCOUNT_CODE, debit: expense.taxAmount ?? 0, credit: 0 });
  }

  journalRows.push({ journalId, accountCode: expense.paymentAccountCode || mapping.bankMandiri, debit: 0, credit: expense.amount });

  await db.insert(journalEntries).values(journalRows);
}

export async function deleteExpenseJournal(expenseId: number) {
  const journal = await db.query.journals.findFirst({ where: eq(journals.referenceId, `expense:${expenseId}`) });
  if (!journal) return;
  await db.delete(journalEntries).where(eq(journalEntries.journalId, journal.id));
  await db.delete(journals).where(eq(journals.id, journal.id));
}
