import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { expenses, journalEntries } from "@/db/schema";
import { ensure, ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { computeExpenseTax, normalizeExpenseTaxMode, normalizeExpenseTaxPercent } from "@/lib/expense-tax";
import { upsertExpenseJournal } from "@/lib/expense-journal";
import { parseMoneyInput } from "@/lib/money";
import { labelKategori } from "@/lib/expense-categories";
import { createNotification } from "@/lib/notifications";
import { getAccountMapping } from "@/lib/account-mapping";

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

export async function GET() {
  try {
    await requireRole(["admin", "finance"]);
    const data = await db.select().from(expenses).orderBy(desc(expenses.id));
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch expenses");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "finance"]);
    const body = await request.json();
    const rawAmount = parseMoneyInput(body.amount);
    ensure(rawAmount > 0, "Nominal pengeluaran harus lebih dari 0");
    const taxMode = normalizeExpenseTaxMode(body.taxMode);
    const taxPercent = normalizeExpenseTaxPercent(body.taxPercent, 11);
    const computedTax = computeExpenseTax(rawAmount, taxMode, taxPercent);
    const mapping = await getAccountMapping();
    const paymentAccountCode = trimString(body.paymentAccountCode, 50) || mapping.bankMandiri;
    const category = trimString(body.category, 200);
    ensure(category.length > 0, "Kategori pengeluaran wajib diisi");
    const description = trimString(body.description, 500);
    ensure(description.length > 0, "Keterangan pengeluaran wajib diisi");

    await ensureSufficientBalance(paymentAccountCode, computedTax.totalAmount);

    const inserted = await db.insert(expenses).values({
      date: body.date ? new Date(body.date) : new Date(),
      category,
      description,
      amount: computedTax.totalAmount,
      taxMode,
      taxPercent,
      taxAmount: computedTax.taxAmount,
      baseAmount: computedTax.baseAmount,
      status: trimString(body.status, 50) || "Approved",
      projectId: body.projectId ? ensurePositiveInt(body.projectId, "projectId") : null,
      paymentAccountCode,
    }).returning({ id: expenses.id });

    if (inserted[0]?.id) {
      await upsertExpenseJournal(inserted[0].id);
      await createNotification({ title: "Pengeluaran baru", message: `${labelKategori(category)} sebesar Rp ${computedTax.totalAmount.toLocaleString('id-ID')} dicatat.`, type: "warning", targetRole: "finance" });
      await audit({ userId: user.id, action: "expense.create", entity: "expense", entityId: inserted[0].id, payload: { category, amount: computedTax.totalAmount } });
    }

    const data = await db.select().from(expenses).orderBy(desc(expenses.id));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return toErrorResponse(error, "Failed to create expense");
  }
}
