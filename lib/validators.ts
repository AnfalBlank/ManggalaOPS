import { and, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { invoices, leads, payments, projects } from "@/db/schema";

export async function getInvoiceWithPayments(invoiceId: number) {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });

  if (!invoice) {
    throw new Error("Tagihan tidak ditemukan");
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
    throw new Error("Tagihan tidak ditemukan");
  }

  if (invoice.clientId !== clientId) {
    throw new Error("Klien pembayaran harus sama dengan klien tagihan");
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
    throw new Error("Jumlah bayar lebih dari sisa tagihan");
  }

  return invoice;
}

export async function ensureInvoiceCanBeUpdated(invoiceId: number, nextTotal: number) {
  const { totalPaid } = await getInvoiceWithPayments(invoiceId);

  if (nextTotal < totalPaid) {
    throw new Error("Total tagihan gak boleh lebih kecil dari pembayaran yang udah masuk");
  }
}

export async function ensureInvoiceCanBeDeleted(invoiceId: number) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.invoiceId, invoiceId),
  });

  if (payment) {
    throw new Error("Tagihan gak bisa dihapus karena udah ada pembayarannya");
  }
}

export async function ensureLeadCanBeDeleted(leadId: number) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.leadId, leadId),
  });

  if (project) {
    throw new Error("Calon klien gak bisa dihapus karena udah dipakai di proyek");
  }
}
