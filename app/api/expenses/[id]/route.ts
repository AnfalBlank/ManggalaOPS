import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { expenses, journalEntries, journals } from "@/db/schema";
import { parseMoneyInput } from "@/lib/money";
import { computeExpenseTax, normalizeExpenseTaxMode, normalizeExpenseTaxPercent } from "@/lib/expense-tax";

async function getAccountBalance(accountCode: string) {
  const rows = await db.select({ balance: sql<number>`coalesce(sum(${journalEntries.debit}) - sum(${journalEntries.credit}), 0)` }).from(journalEntries).where(eq(journalEntries.accountCode, accountCode));
  return rows[0]?.balance ?? 0;
}

async function ensureSufficientBalance(accountCode: string, amount: number, expenseId?: number) {
  const balance = await getAccountBalance(accountCode);
  const currentExpense = expenseId ? await db.query.expenses.findFirst({ where: eq(expenses.id, expenseId) }) : null;
  const reimbursed = currentExpense?.paymentAccountCode === accountCode ? currentExpense.amount : 0;
  const effectiveBalance = balance + reimbursed;
  if (amount > effectiveBalance) {
    throw new Error(`Saldo akun pembayaran tidak cukup. Tersedia ${effectiveBalance.toLocaleString("id-ID")}, butuh ${amount.toLocaleString("id-ID")}.`);
  }
}

async function upsertExpenseJournal(expenseId: number) {
  const expense = await db.query.expenses.findFirst({ where: eq(expenses.id, expenseId) });
  if (!expense) throw new Error("Expense tidak ditemukan");

  const existingJournal = await db.query.journals.findFirst({ where: eq(journals.referenceId, `expense:${expenseId}`) });
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

  const expenseAccountCode = expense.projectId ? "5002" : "5001";
  const journalRows = [
    { journalId, accountCode: expenseAccountCode, debit: expense.baseAmount ?? expense.amount, credit: 0 },
  ];

  if ((expense.taxAmount ?? 0) > 0) {
    journalRows.push({ journalId, accountCode: "1301", debit: expense.taxAmount ?? 0, credit: 0 });
  }

  journalRows.push({ journalId, accountCode: expense.paymentAccountCode || "1002", debit: 0, credit: expense.amount });

  await db.insert(journalEntries).values(journalRows);
}

async function deleteExpenseJournal(expenseId: number) {
  const journal = await db.query.journals.findFirst({ where: eq(journals.referenceId, `expense:${expenseId}`) });
  if (!journal) return;
  await db.delete(journalEntries).where(eq(journalEntries.journalId, journal.id));
  await db.delete(journals).where(eq(journals.id, journal.id));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const expenseId = Number(id);
    const body = await request.json();
    const rawAmount = parseMoneyInput(body.amount);
    const taxMode = normalizeExpenseTaxMode(body.taxMode);
    const taxPercent = normalizeExpenseTaxPercent(body.taxPercent, 11);
    const computedTax = computeExpenseTax(rawAmount, taxMode, taxPercent);
    const paymentAccountCode = String(body.paymentAccountCode ?? "1002").trim() || "1002";

    await ensureSufficientBalance(paymentAccountCode, computedTax.totalAmount, expenseId);

    await db.update(expenses).set({
      date: body.date ? new Date(body.date) : new Date(),
      category: String(body.category ?? "").trim(),
      description: String(body.description ?? "").trim(),
      amount: computedTax.totalAmount,
      taxMode,
      taxPercent,
      taxAmount: computedTax.taxAmount,
      baseAmount: computedTax.baseAmount,
      status: String(body.status ?? "Approved").trim() || "Approved",
      projectId: body.projectId ? Number(body.projectId) : null,
      paymentAccountCode,
    }).where(eq(expenses.id, expenseId));

    await upsertExpenseJournal(expenseId);
    const data = await db.select().from(expenses).orderBy(desc(expenses.id));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const expenseId = Number(id);
    await deleteExpenseJournal(expenseId);
    await db.delete(expenses).where(eq(expenses.id, expenseId));
    const data = await db.select().from(expenses).orderBy(desc(expenses.id));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete expense" }, { status: 500 });
  }
}
