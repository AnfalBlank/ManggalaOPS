import { asc } from "drizzle-orm";

import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
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
    })
    .from(invoices)
    .orderBy(asc(invoices.id));

  return rows.map((row) => ({
    id: row.id,
    code: formatDocumentNumber("INV", row.id),
  }));
}
