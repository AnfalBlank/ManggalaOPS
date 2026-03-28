import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { expenses, journalEntries, journals } from "@/db/schema";
import { parseMoneyInput } from "@/lib/money";

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
  await db.insert(journalEntries).values([
    { journalId, accountCode: expense.projectId ? "5002" : "5001", debit: expense.amount, credit: 0 },
    { journalId, accountCode: "1002", debit: 0, credit: expense.amount },
  ]);
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

    await db.update(expenses).set({
      date: body.date ? new Date(body.date) : new Date(),
      category: String(body.category ?? "").trim(),
      description: String(body.description ?? "").trim(),
      amount: parseMoneyInput(body.amount),
      status: String(body.status ?? "Approved").trim() || "Approved",
      projectId: body.projectId ? Number(body.projectId) : null,
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
