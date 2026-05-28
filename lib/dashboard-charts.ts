import { sql } from "drizzle-orm";

import { db } from "@/db";
import { expenses, payments } from "@/db/schema";

export type MonthBucket = { name: string; total: number };
export type CashflowMonthBucket = { name: string; in: number; out: number };

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function emptyMonths(): MonthBucket[] {
  return MONTH_LABELS.map((name) => ({ name, total: 0 }));
}

function emptyCashflow(): CashflowMonthBucket[] {
  return MONTH_LABELS.map((name) => ({ name, in: 0, out: 0 }));
}

/**
 * Aggregate income (payments) and expenses for the current year, grouped per month.
 * Returns 12 buckets so the chart shows full year context (Jan–Dec).
 */
export async function getDashboardChartData() {
  const year = new Date().getFullYear();
  const startTs = Math.floor(new Date(year, 0, 1).getTime() / 1000);
  const endTs = Math.floor(new Date(year + 1, 0, 1).getTime() / 1000);

  // SQLite stores dates as unix seconds via Drizzle integer/timestamp mode.
  // Use strftime to bucket by month (1-12).
  const [incomeRows, expenseRows] = await Promise.all([
    db
      .select({
        month: sql<string>`strftime('%m', datetime(${payments.date}, 'unixepoch'))`.as("month"),
        total: sql<number>`coalesce(sum(${payments.amount}), 0)`.as("total"),
      })
      .from(payments)
      .where(sql`${payments.date} >= ${startTs} AND ${payments.date} < ${endTs}`)
      .groupBy(sql`month`),
    db
      .select({
        month: sql<string>`strftime('%m', datetime(${expenses.date}, 'unixepoch'))`.as("month"),
        total: sql<number>`coalesce(sum(${expenses.amount}), 0)`.as("total"),
      })
      .from(expenses)
      .where(sql`${expenses.date} >= ${startTs} AND ${expenses.date} < ${endTs}`)
      .groupBy(sql`month`),
  ]);

  const revenueData = emptyMonths();
  const cashflowData = emptyCashflow();

  for (const row of incomeRows) {
    const idx = Math.max(0, Math.min(11, Number(row.month) - 1));
    revenueData[idx].total = Number(row.total ?? 0);
    cashflowData[idx].in = Number(row.total ?? 0);
  }
  for (const row of expenseRows) {
    const idx = Math.max(0, Math.min(11, Number(row.month) - 1));
    cashflowData[idx].out = Number(row.total ?? 0);
  }

  return { revenueData, cashflowData, year };
}
