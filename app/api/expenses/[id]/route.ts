import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { expenses, journalEntries } from "@/db/schema";
import { ensure, ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { computeExpenseTax, normalizeExpenseTaxMode, normalizeExpenseTaxPercent } from "@/lib/expense-tax";
import { deleteExpenseJournal, upsertExpenseJournal } from "@/lib/expense-journal";
import { parseMoneyInput } from "@/lib/money";
import { getAccountMapping } from "@/lib/account-mapping";

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance"]);
    const { id } = await params;
    const expenseId = ensurePositiveInt(id, "expense id");
    const body = await request.json();
    const rawAmount = parseMoneyInput(body.amount);
    ensure(rawAmount > 0, "Amount expense harus lebih besar dari 0");
    const taxMode = normalizeExpenseTaxMode(body.taxMode);
    const taxPercent = normalizeExpenseTaxPercent(body.taxPercent, 11);
    const computedTax = computeExpenseTax(rawAmount, taxMode, taxPercent);
    const mapping = await getAccountMapping();
    const paymentAccountCode = trimString(body.paymentAccountCode, 50) || mapping.bankMandiri;

    await ensureSufficientBalance(paymentAccountCode, computedTax.totalAmount, expenseId);

    await db.update(expenses).set({
      date: body.date ? new Date(body.date) : new Date(),
      category: trimString(body.category, 200),
      description: trimString(body.description, 500),
      amount: computedTax.totalAmount,
      taxMode,
      taxPercent,
      taxAmount: computedTax.taxAmount,
      baseAmount: computedTax.baseAmount,
      status: trimString(body.status, 50) || "Approved",
      projectId: body.projectId ? ensurePositiveInt(body.projectId, "projectId") : null,
      paymentAccountCode,
    }).where(eq(expenses.id, expenseId));

    await upsertExpenseJournal(expenseId);
    await audit({ userId: user.id, action: "expense.update", entity: "expense", entityId: expenseId });
    const data = await db.select().from(expenses).orderBy(desc(expenses.id));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return toErrorResponse(error, "Failed to update expense");
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance"]);
    const { id } = await params;
    const expenseId = ensurePositiveInt(id, "expense id");
    await deleteExpenseJournal(expenseId);
    await db.delete(expenses).where(eq(expenses.id, expenseId));
    await audit({ userId: user.id, action: "expense.delete", entity: "expense", entityId: expenseId });
    const data = await db.select().from(expenses).orderBy(desc(expenses.id));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete expense");
  }
}
