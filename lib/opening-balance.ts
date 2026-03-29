import { desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { accounts, journalEntries, journals, openingBalances } from "@/db/schema";

const REQUIRED_OPENING_ACCOUNTS = [
  { code: "1001", name: "Kas", type: "Asset", normalBalance: "Debit" },
  { code: "1002", name: "Bank Mandiri", type: "Asset", normalBalance: "Debit" },
  { code: "1003", name: "Bank BCA", type: "Asset", normalBalance: "Debit" },
  { code: "1101", name: "Piutang Usaha", type: "Asset", normalBalance: "Debit" },
  { code: "1201", name: "Aset Tetap", type: "Asset", normalBalance: "Debit" },
  { code: "2001", name: "Hutang Usaha", type: "Liability", normalBalance: "Credit" },
  { code: "2101", name: "PPN Keluaran", type: "Liability", normalBalance: "Credit" },
  { code: "3001", name: "Modal", type: "Equity", normalBalance: "Credit" },
  { code: "4001", name: "Pendapatan Project", type: "Revenue", normalBalance: "Credit" },
  { code: "4002", name: "Pendapatan Non Project", type: "Revenue", normalBalance: "Credit" },
  { code: "5001", name: "Beban Operasional", type: "Expense", normalBalance: "Debit" },
  { code: "5002", name: "Beban Project", type: "Expense", normalBalance: "Debit" },
];

async function ensureRequiredAccounts() {
  const existing = await db.select({ code: accounts.code }).from(accounts).where(inArray(accounts.code, REQUIRED_OPENING_ACCOUNTS.map((account) => account.code)));
  const existingCodes = new Set(existing.map((row) => row.code));
  const missing = REQUIRED_OPENING_ACCOUNTS.filter((account) => !existingCodes.has(account.code));
  if (missing.length > 0) {
    await db.insert(accounts).values(missing);
  }
}

export async function getOpeningBalance() {
  return await db.query.openingBalances.findFirst({ orderBy: desc(openingBalances.id) });
}

export function computeOpeningBalanceTotals(input: {
  cashOnHand: number;
  bankMandiri: number;
  bankBca: number;
  receivables: number;
  fixedAssets: number;
  liabilities: number;
  equity: number;
}) {
  const totalDebit = input.cashOnHand + input.bankMandiri + input.bankBca + input.receivables + input.fixedAssets;
  const totalCredit = input.liabilities + input.equity;
  return { totalDebit, totalCredit, balanced: totalDebit === totalCredit };
}

export async function saveOpeningBalance(input: {
  cashOnHand: number;
  bankMandiri: number;
  bankBca: number;
  receivables: number;
  fixedAssets: number;
  liabilities: number;
  equity: number;
}) {
  await ensureRequiredAccounts();

  const totals = computeOpeningBalanceTotals(input);
  if (!totals.balanced) {
    throw new Error(`Saldo awal tidak balance. Debit ${totals.totalDebit.toLocaleString("id-ID")} harus sama dengan Kredit ${totals.totalCredit.toLocaleString("id-ID")}.`);
  }

  const existing = await getOpeningBalance();
  const now = new Date();
  const payload = { ...input, updatedAt: now, createdAt: existing?.createdAt ?? now };

  if (existing?.id) {
    await db.update(openingBalances).set(payload).where(eq(openingBalances.id, existing.id));
  } else {
    await db.insert(openingBalances).values(payload);
  }

  const existingJournal = await db.query.journals.findFirst({ where: eq(journals.referenceId, "opening_balance") });
  let journalId = existingJournal?.id;

  if (!journalId) {
    const inserted = await db.insert(journals).values({
      date: now,
      description: "Opening Balance Setup",
      referenceId: "opening_balance",
    }).returning({ id: journals.id });
    journalId = inserted[0]?.id;
  } else {
    await db.update(journals).set({ date: now, description: "Opening Balance Setup" }).where(eq(journals.id, journalId));
  }

  if (!journalId) throw new Error("Failed to create opening journal");

  await db.delete(journalEntries).where(eq(journalEntries.journalId, journalId));

  const rows = [
    { journalId, accountCode: "1001", debit: input.cashOnHand, credit: 0 },
    { journalId, accountCode: "1002", debit: input.bankMandiri, credit: 0 },
    { journalId, accountCode: "1003", debit: input.bankBca, credit: 0 },
    { journalId, accountCode: "1101", debit: input.receivables, credit: 0 },
    { journalId, accountCode: "1201", debit: input.fixedAssets, credit: 0 },
    { journalId, accountCode: "2001", debit: 0, credit: input.liabilities },
    { journalId, accountCode: "3001", debit: 0, credit: input.equity },
  ].filter((item) => item.debit > 0 || item.credit > 0);

  if (rows.length > 0) {
    await db.insert(journalEntries).values(rows);
  }

  return await getOpeningBalance();
}
