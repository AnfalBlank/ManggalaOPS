import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { clients, deliveryOrderItems, deliveryOrders, invoices, projects } from "@/db/schema";
import { toIsoString } from "@/lib/db-utils";
import { formatDocumentNumber } from "@/lib/format";

export type DeliveryOrderItemRow = {
  id: number;
  description: string;
  qty: number;
  unit: string | null;
  serialNumber: string | null;
  notes: string | null;
};

export type DeliveryOrderListItem = {
  id: number;
  code: string;
  clientId: number;
  clientName: string;
  projectId: number | null;
  projectName: string | null;
  invoiceId: number | null;
  invoiceCode: string | null;
  quotationId: number | null;
  date: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  shippingMethod: string | null;
  recipientName: string | null;
  recipientCompany: string | null;
  recipientAddress: string | null;
  recipientPhone: string | null;
  subject: string | null;
  introduction: string | null;
  notes: string | null;
  closingNote: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  status: string;
  items: DeliveryOrderItemRow[];
};

export async function getDeliveryOrders(): Promise<DeliveryOrderListItem[]> {
  const rows = await db
    .select({
      id: deliveryOrders.id,
      clientId: deliveryOrders.clientId,
      clientName: clients.name,
      projectId: deliveryOrders.projectId,
      projectName: projects.name,
      invoiceId: deliveryOrders.invoiceId,
      quotationId: deliveryOrders.quotationId,
      date: deliveryOrders.date,
      vehicleNumber: deliveryOrders.vehicleNumber,
      driverName: deliveryOrders.driverName,
      shippingMethod: deliveryOrders.shippingMethod,
      recipientName: deliveryOrders.recipientName,
      recipientCompany: deliveryOrders.recipientCompany,
      recipientAddress: deliveryOrders.recipientAddress,
      recipientPhone: deliveryOrders.recipientPhone,
      subject: deliveryOrders.subject,
      introduction: deliveryOrders.introduction,
      notes: deliveryOrders.notes,
      closingNote: deliveryOrders.closingNote,
      signatoryName: deliveryOrders.signatoryName,
      signatoryTitle: deliveryOrders.signatoryTitle,
      status: deliveryOrders.status,
    })
    .from(deliveryOrders)
    .innerJoin(clients, eq(deliveryOrders.clientId, clients.id))
    .leftJoin(projects, eq(deliveryOrders.projectId, projects.id))
    .orderBy(desc(deliveryOrders.id));

  const itemRows = await db.select().from(deliveryOrderItems);

  return rows.map((row) => ({
    id: row.id,
    code: formatDocumentNumber("SJ", row.id),
    clientId: row.clientId,
    clientName: row.clientName,
    projectId: row.projectId,
    projectName: row.projectName,
    invoiceId: row.invoiceId,
    invoiceCode: row.invoiceId ? formatDocumentNumber("INV", row.invoiceId) : null,
    quotationId: row.quotationId,
    date: toIsoString(row.date),
    vehicleNumber: row.vehicleNumber,
    driverName: row.driverName,
    shippingMethod: row.shippingMethod,
    recipientName: row.recipientName,
    recipientCompany: row.recipientCompany,
    recipientAddress: row.recipientAddress,
    recipientPhone: row.recipientPhone,
    subject: row.subject,
    introduction: row.introduction,
    notes: row.notes,
    closingNote: row.closingNote,
    signatoryName: row.signatoryName,
    signatoryTitle: row.signatoryTitle,
    status: row.status ?? "Draft",
    items: itemRows
      .filter((item) => item.deliveryOrderId === row.id)
      .map((item) => ({
        id: item.id,
        description: item.description,
        qty: item.qty,
        unit: item.unit,
        serialNumber: item.serialNumber,
        notes: item.notes,
      })),
  }));
}

export async function getInvoiceForDeliveryOrder(invoiceId: number) {
  const result = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: {},
  });
  return result;
}
