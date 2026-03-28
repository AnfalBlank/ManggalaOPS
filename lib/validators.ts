import { and, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { invoices, leads, payments, projects } from "@/db/schema";

export async function getInvoiceWithPayments(invoiceId: number) {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });

  if (!invoice) {
    throw new Error("Invoice tidak ditemukan");
  }

  const paymentSummary = await db
    .select({
      totalPaid: sql<number>`coalesce(sum(${payments.amount}), 0)`.as("totalPaid"),
    })
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId));

  return {
    invoice,
    totalPaid: paymentSummary[0]?.totalPaid ?? 0,
  };
}

export async function ensurePaymentMatchesInvoice({
  invoiceId,
  clientId,
  amount,
  excludePaymentId,
}: {
  invoiceId: number;
  clientId: number;
  amount: number;
  excludePaymentId?: number;
}) {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });

  if (!invoice) {
    throw new Error("Invoice tidak ditemukan");
  }

  if (invoice.clientId !== clientId) {
    throw new Error("Client payment harus sama dengan client invoice");
  }

  const conditions = [eq(payments.invoiceId, invoiceId)];
  if (excludePaymentId) {
    conditions.push(ne(payments.id, excludePaymentId));
  }

  const existing = await db
    .select({
      totalPaid: sql<number>`coalesce(sum(${payments.amount}), 0)`.as("totalPaid"),
    })
    .from(payments)
    .where(and(...conditions));

  const existingPaid = existing[0]?.totalPaid ?? 0;
  const projectedTotal = existingPaid + amount;
  const invoiceTotal = invoice.total ?? 0;

  if (projectedTotal > invoiceTotal) {
    throw new Error("Nominal payment melebihi outstanding invoice");
  }

  return invoice;
}

export async function ensureInvoiceCanBeUpdated(invoiceId: number, nextTotal: number) {
  const { totalPaid } = await getInvoiceWithPayments(invoiceId);

  if (nextTotal < totalPaid) {
    throw new Error("Total invoice tidak boleh lebih kecil dari total payment yang sudah masuk");
  }
}

export async function ensureInvoiceCanBeDeleted(invoiceId: number) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.invoiceId, invoiceId),
  });

  if (payment) {
    throw new Error("Invoice tidak bisa dihapus karena masih punya payment");
  }
}

export async function ensureLeadCanBeDeleted(leadId: number) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.leadId, leadId),
  });

  if (project) {
    throw new Error("Lead tidak bisa dihapus karena sudah dipakai project");
  }
}
