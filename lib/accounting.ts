import { asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { accounts } from "@/db/schema";

export const DEFAULT_COA = [
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

export async function initializeDefaultCoa() {
  const existing = await db.select({ code: accounts.code }).from(accounts).where(inArray(accounts.code, DEFAULT_COA.map((account) => account.code)));
  const existingCodes = new Set(existing.map((row) => row.code));
  const missing = DEFAULT_COA.filter((account) => !existingCodes.has(account.code));
  if (missing.length > 0) {
    await db.insert(accounts).values(missing);
  }
  return getCoaList();
}

export async function getCoaList() {
  return await db.select().from(accounts).orderBy(asc(accounts.code));
}

export async function updateAccount(input: { code: string; name: string; type: string; normalBalance: string }) {
  await db.update(accounts).set({ name: input.name, type: input.type, normalBalance: input.normalBalance }).where(eq(accounts.code, input.code));
  return getCoaList();
}
