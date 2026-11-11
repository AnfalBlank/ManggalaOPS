import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clientPos, deliveryOrderItems, deliveryOrders, invoiceItems, invoices, quotationItems, quotations } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getDeliveryOrders } from "@/lib/data-delivery";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    await requireRole(["admin", "finance", "sales", "project_manager"]);
    const data = await getDeliveryOrders();
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Gagal ambil data surat jalan");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "sales", "project_manager"]);
    const body = await request.json();
    const clientId = ensurePositiveInt(body.clientId, "clientId");
    const items = (Array.isArray(body.items) ? body.items : []) as Array<{
      description?: string;
      qty?: number | string;
      unit?: string | null;
      serialNumber?: string | null;
      notes?: string | null;
    }>;
    ensure(items.length > 0, "Minimal satu item barang");

    const projectId = body.projectId ? ensurePositiveInt(body.projectId, "projectId") : null;
    const invoiceId = body.invoiceId ? ensurePositiveInt(body.invoiceId, "invoiceId") : null;
    const quotationId = body.quotationId ? ensurePositiveInt(body.quotationId, "quotationId") : null;
    const date = body.date ? new Date(body.date) : new Date();
    // Barang yang punya PO klien dikirim lewat halaman PO (biar sisa barang kehitung), bukan form bebas ini.
    if (invoiceId) {
      const inv = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
      ensure(!inv?.clientPoId, "Tagihan ini punya PO klien. Bikin surat jalan dari halaman PO biar sisa barang kehitung.");
    }
    if (quotationId) {
      const po = await db.query.clientPos.findFirst({ where: eq(clientPos.quotationId, quotationId) });
      ensure(!po, `Penawaran ini udah punya PO ${po?.poNumber ?? ""}. Bikin surat jalan dari halaman PO biar sisa barang kehitung.`);
    }

    const newId = await db.transaction(async (tx) => {
      const inserted = await tx.insert(deliveryOrders).values({
        clientId,
        projectId,
        invoiceId,
        quotationId,
        date,
        vehicleNumber: nullableTrim(body.vehicleNumber, 50),
        driverName: nullableTrim(body.driverName, 200),
        shippingMethod: nullableTrim(body.shippingMethod, 100),
        recipientName: nullableTrim(body.recipientName, 200),
        recipientCompany: nullableTrim(body.recipientCompany, 200),
        recipientAddress: nullableTrim(body.recipientAddress, 500),
        recipientPhone: nullableTrim(body.recipientPhone, 50),
        subject: nullableTrim(body.subject, 500),
        introduction: nullableTrim(body.introduction, 2000),
        notes: nullableTrim(body.notes, 2000),
        closingNote: nullableTrim(body.closingNote, 2000),
        signatoryName: nullableTrim(body.signatoryName, 200),
        signatoryTitle: nullableTrim(body.signatoryTitle, 200),
        status: trimString(body.status, 50) || "Draft",
        createdAt: new Date(),
      }).returning({ id: deliveryOrders.id });

      const createdId = inserted[0]?.id;
      if (!createdId) throw new Error("Gagal membuat surat jalan");

      await tx.insert(deliveryOrderItems).values(items.map((item) => ({
        deliveryOrderId: createdId,
        description: trimString(item.description, 1000),
        qty: Math.max(1, Number(item.qty ?? 0) || 1),
        unit: trimString(item.unit ?? "", 50) || "Unit",
        serialNumber: nullableTrim(item.serialNumber, 200),
        notes: nullableTrim(item.notes, 500),
      })));

      return createdId;
    });

    await createNotification({ title: "Surat jalan baru", message: `Surat jalan #${newId} udah dibuat.`, type: "info", targetRole: "project_manager" });
    await audit({ userId: user.id, action: "delivery_order.create", entity: "delivery_order", entityId: newId, payload: { clientId } });

    return NextResponse.json({ ok: true, data: await getDeliveryOrders() });
  } catch (error) {
    return toErrorResponse(error, "Gagal bikin surat jalan");
  }
}

/**
 * POST helper handled by /api/delivery-orders/from-invoice/[invoiceId] in a separate route.
 */

// Helper exported for route.ts/from-invoice usage; using same module avoids circular import.
export async function buildDeliveryOrderItemsFromInvoice(invoiceId: number) {
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  if (items.length === 0) return [];
  return items.map((item) => ({
    description: item.description,
    qty: item.qty,
    unit: item.unit ?? "Unit",
  }));
}

export async function buildDeliveryOrderItemsFromQuotation(quotationId: number) {
  const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
  if (items.length === 0) return [];
  return items.map((item) => ({
    description: item.description,
    qty: item.qty,
    unit: item.unit ?? "Unit",
  }));
}

export async function findInvoiceMeta(invoiceId: number) {
  return db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
}

export async function findQuotationMeta(quotationId: number) {
  return db.query.quotations.findFirst({ where: eq(quotations.id, quotationId) });
}
