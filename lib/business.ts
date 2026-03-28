import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  invoiceItems,
  invoices,
  journalEntries,
  journals,
  payments,
  projects,
  quotations,
} from "@/db/schema";

export async function acceptQuotationAndCreateProject(quotationId: number) {
  const quotation = await db.query.quotations.findFirst({
    where: eq(quotations.id, quotationId),
  });

  if (!quotation) {
    throw new Error("Quotation tidak ditemukan");
  }

  let projectId = quotation.projectId ?? null;

  if (!projectId) {
    const insertedProject = await db
      .insert(projects)
      .values({
        clientId: quotation.clientId,
        name: `Project from QUO-${String(quotation.id).padStart(4, "0")}`,
        value: quotation.total ?? quotation.subtotal ?? 0,
        status: "In Progress",
        progress: 0,
        startDate: new Date(),
      })
      .returning({ id: projects.id });

    projectId = insertedProject[0]?.id ?? null;
  }

  await db
    .update(quotations)
    .set({
      status: "Accepted",
      projectId,
    })
    .where(eq(quotations.id, quotationId));

  return {
    quotationId,
    projectId,
  };
}

export async function createInvoiceFromQuotation(quotationId: number) {
  const quotation = await db.query.quotations.findFirst({
    where: eq(quotations.id, quotationId),
  });

  if (!quotation) {
    throw new Error("Quotation tidak ditemukan");
  }

  const insertedInvoice = await db
    .insert(invoices)
    .values({
      clientId: quotation.clientId,
      projectId: quotation.projectId,
      quotationId: quotation.id,
      date: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      total: quotation.total,
      status: "Unpaid",
    })
    .returning({ id: invoices.id });

  const invoiceId = insertedInvoice[0]?.id;

  if (invoiceId) {
    await db.insert(invoiceItems).values({
      invoiceId,
      description: `Invoice from quotation #${quotation.id}`,
      qty: 1,
      unitPrice: quotation.total ?? 0,
      amount: quotation.total ?? 0,
    });
  }

  return { invoiceId };
}

export async function createJournalForPayment(paymentId: number) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
  });

  if (!payment) {
    throw new Error("Payment tidak ditemukan");
  }

  const existingJournal = await db.query.journals.findFirst({
    where: eq(journals.referenceId, `payment:${paymentId}`),
  });

  if (existingJournal) {
    return { journalId: existingJournal.id, created: false };
  }

  const insertedJournal = await db
    .insert(journals)
    .values({
      date: payment.date,
      description: `Payment received for invoice #${payment.invoiceId}`,
      referenceId: `payment:${paymentId}`,
    })
    .returning({ id: journals.id });

  const journalId = insertedJournal[0]?.id;

  if (!journalId) {
    throw new Error("Gagal membuat jurnal payment");
  }

  await db.insert(journalEntries).values([
    {
      journalId,
      accountCode: "1002",
      debit: payment.amount,
      credit: 0,
    },
    {
      journalId,
      accountCode: "1101",
      debit: 0,
      credit: payment.amount,
    },
  ]);

  return { journalId, created: true };
}

export async function getFinanceSummary() {
  const [incomeRows, expenseRows] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)`.as("total") }).from(payments),
    db.select({ total: sql<number>`coalesce(sum(amount), 0)`.as("total") }).from(sql`expenses`),
  ]);

  const totalIncome = incomeRows[0]?.total ?? 0;
  const totalExpense = expenseRows[0]?.total ?? 0;

  return {
    totalIncome,
    totalExpense,
    netCashFlow: totalIncome - totalExpense,
  };
}
