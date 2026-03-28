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

export async function upsertInvoiceJournal(invoiceId: number) {
  const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
  if (!invoice) throw new Error("Invoice tidak ditemukan");

  const existingJournal = await db.query.journals.findFirst({
    where: eq(journals.referenceId, `invoice:${invoiceId}`),
  });

  let journalId = existingJournal?.id;

  if (!journalId) {
    const inserted = await db.insert(journals).values({
      date: invoice.date,
      description: `Invoice issued #${invoiceId}`,
      referenceId: `invoice:${invoiceId}`,
    }).returning({ id: journals.id });
    journalId = inserted[0]?.id;
  }

  if (!journalId) throw new Error("Gagal membuat jurnal invoice");

  await db.delete(journalEntries).where(eq(journalEntries.journalId, journalId));
  await db.insert(journalEntries).values([
    { journalId, accountCode: "1101", debit: invoice.total ?? 0, credit: 0 },
    { journalId, accountCode: invoice.projectId ? "4001" : "4002", debit: 0, credit: invoice.subtotal ?? 0 },
    { journalId, accountCode: "2101", debit: 0, credit: invoice.tax ?? 0 },
  ]);

  return { journalId };
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
    await upsertInvoiceJournal(invoiceId);
  }

  return { invoiceId };
}

export async function upsertPaymentJournal(paymentId: number) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
  });

  if (!payment) {
    throw new Error("Payment tidak ditemukan");
  }

  const existingJournal = await db.query.journals.findFirst({
    where: eq(journals.referenceId, `payment:${paymentId}`),
  });

  let journalId = existingJournal?.id;

  if (!journalId) {
    const insertedJournal = await db
      .insert(journals)
      .values({
        date: payment.date,
        description: `Payment received for invoice #${payment.invoiceId}`,
        referenceId: `payment:${paymentId}`,
      })
      .returning({ id: journals.id });

    journalId = insertedJournal[0]?.id;
  }

  if (!journalId) {
    throw new Error("Gagal membuat jurnal payment");
  }

  await db.delete(journalEntries).where(eq(journalEntries.journalId, journalId));
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

  return { journalId, created: !existingJournal };
}

export async function deletePaymentJournal(paymentId: number) {
  const journal = await db.query.journals.findFirst({
    where: eq(journals.referenceId, `payment:${paymentId}`),
  });

  if (!journal) return;

  await db.delete(journalEntries).where(eq(journalEntries.journalId, journal.id));
  await db.delete(journals).where(eq(journals.id, journal.id));
}

export async function deleteInvoiceJournal(invoiceId: number) {
  const journal = await db.query.journals.findFirst({
    where: eq(journals.referenceId, `invoice:${invoiceId}`),
  });

  if (!journal) return;

  await db.delete(journalEntries).where(eq(journalEntries.journalId, journal.id));
  await db.delete(journals).where(eq(journals.id, journal.id));
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
