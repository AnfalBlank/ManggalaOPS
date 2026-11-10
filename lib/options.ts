import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { accounts, clients, invoices, payments } from "@/db/schema";
import { formatDocumentNumber } from "@/lib/format";

export async function getClientOptions() {
  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      contactPerson: clients.contactPerson,
      phone: clients.phone,
      email: clients.email,
      address: clients.address,
    })
    .from(clients)
    .orderBy(asc(clients.name));

  return rows;
}

export async function getInvoiceOptions() {
  // Hanya kembalikan invoice yang BELUM lunas (outstanding > 0).
  // Invoice sudah Paid tidak perlu muncul di dropdown Record Payment.
  const paymentTotals = db
    .select({
      invoiceId: payments.invoiceId,
      amountPaid: sql<number>`coalesce(sum(${payments.amount}), 0)`.as("amountPaid"),
    })
    .from(payments)
    .groupBy(payments.invoiceId)
    .as("pt");

  const rows = await db
    .select({
      id: invoices.id,
      clientId: invoices.clientId,
      clientName: clients.name,
      total: invoices.total,
      amountPaid: paymentTotals.amountPaid,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(paymentTotals, eq(invoices.id, paymentTotals.invoiceId))
    .orderBy(asc(invoices.id));

  // Only return invoices that still have outstanding balance.
  return rows
    .filter((row) => {
      const total = Number(row.total ?? 0);
      const paid = Number(row.amountPaid ?? 0);
      return total > 0 && total - paid >= 1; // sisa di bawah Rp 1 (pecahan sen) = lunas
    })
    .map((row) => ({
      id: row.id,
      code: formatDocumentNumber("INV", row.id),
      clientId: row.clientId,
      clientName: row.clientName,
      total: Number(row.total ?? 0),
      amountPaid: Number(row.amountPaid ?? 0),
      outstanding: Number(row.total ?? 0) - Number(row.amountPaid ?? 0),
    }));
}

export async function getPaymentAccountOptions() {
  return await db
    .select({
      code: accounts.code,
      name: accounts.name,
    })
    .from(accounts)
    .where(eq(accounts.type, "Asset"))
    .orderBy(asc(accounts.code));
}
