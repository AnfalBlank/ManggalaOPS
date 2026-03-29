import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { accounts, clients, invoices } from "@/db/schema";
import { formatDocumentNumber } from "@/lib/format";

export async function getClientOptions() {
  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
    })
    .from(clients)
    .orderBy(asc(clients.name));

  return rows;
}

export async function getInvoiceOptions() {
  const rows = await db
    .select({
      id: invoices.id,
      clientId: invoices.clientId,
      clientName: clients.name,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(asc(invoices.id));

  return rows.map((row) => ({
    id: row.id,
    code: formatDocumentNumber("INV", row.id),
    clientId: row.clientId,
    clientName: row.clientName,
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
