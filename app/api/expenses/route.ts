import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { expenses, journalEntries, journals } from "@/db/schema";
import { parseMoneyInput } from "@/lib/money";
import { createNotification } from "@/lib/notifications";
import { computeExpenseTax, normalizeExpenseTaxMode, normalizeExpenseTaxPercent } from "@/lib/expense-tax";

async function getAccountBalance(accountCode: string) {
  const rows = await db.select({ balance: sql<number>`coalesce(sum(${journalEntries.debit}) - sum(${journalEntries.credit}), 0)` }).from(journalEntries).where(eq(journalEntries.accountCode, accountCode));
  return rows[0]?.balance ?? 0;
}

async function ensureSufficientBalance(accountCode: string, amount: number) {
  const balance = await getAccountBalance(accountCode);
  if (amount > balance) {
    throw new Error(`Saldo akun pembayaran tidak cukup. Tersedia ${balance.toLocaleString("id-ID")}, butuh ${amount.toLocaleString("id-ID")}.`);
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

export async function GET() {
  const data = await db.select().from(expenses).orderBy(desc(expenses.id));
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawAmount = parseMoneyInput(body.amount);
    const taxMode = normalizeExpenseTaxMode(body.taxMode);
    const taxPercent = normalizeExpenseTaxPercent(body.taxPercent, 11);
    const computedTax = computeExpenseTax(rawAmount, taxMode, taxPercent);
    const paymentAccountCode = String(body.paymentAccountCode ?? "1002").trim() || "1002";

    await ensureSufficientBalance(paymentAccountCode, computedTax.totalAmount);

    const inserted = await db.insert(expenses).values({
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
    }).returning({ id: expenses.id });

    if (inserted[0]?.id) {
      await upsertExpenseJournal(inserted[0].id);
      await createNotification({ title: "Expense baru dibuat", message: `${String(body.category ?? 'Expense')} sebesar ${computedTax.totalAmount.toLocaleString('id-ID')} menunggu pemantauan.`, type: "warning", targetRole: "finance" });
    }

    const data = await db.select().from(expenses).orderBy(desc(expenses.id));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create expense" }, { status: 500 });
  }
}
