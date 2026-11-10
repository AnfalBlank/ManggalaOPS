import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clients, deliveryOrderItems, deliveryOrders, invoiceItems, invoices } from "@/db/schema";
import { ensurePositiveInt, toErrorResponse } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getDeliveryOrders } from "@/lib/data-delivery";
import { getAppSettings } from "@/lib/settings";

/**
 * Auto-generate a delivery order from an existing invoice. The created
 * surat jalan inherits items, recipient, and metadata from the invoice
 * so the document numbering and format stay consistent.
 */
export async function POST(_: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales", "project_manager"]);
    const { invoiceId: rawId } = await params;
    const invoiceId = ensurePositiveInt(rawId, "invoiceId");

    const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
    if (!invoice) {
      return NextResponse.json({ error: "Tagihan gak ketemu" }, { status: 404 });
    }

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    if (items.length === 0) {
      return NextResponse.json({ error: "Tagihan ini gak punya barang" }, { status: 400 });
    }

    const client = await db.query.clients.findFirst({ where: eq(clients.id, invoice.clientId) });
    const settings = await getAppSettings();

    const newId = await db.transaction(async (tx) => {
      const inserted = await tx.insert(deliveryOrders).values({
        clientId: invoice.clientId,
        projectId: invoice.projectId,
        invoiceId: invoice.id,
        quotationId: invoice.quotationId,
        date: new Date(),
        vehicleNumber: null,
        driverName: null,
        shippingMethod: "Direct Delivery",
        recipientName: invoice.recipientName ?? client?.contactPerson ?? client?.name ?? null,
        recipientCompany: invoice.recipientCompany ?? client?.name ?? null,
        recipientAddress: invoice.recipientAddress ?? client?.address ?? null,
        recipientPhone: client?.phone ?? null,
        subject: invoice.subject ? `Surat Jalan: ${invoice.subject}` : "Surat Jalan",
        introduction: "Bersama ini kami sampaikan pengiriman barang dengan rincian sebagai berikut. Mohon diperiksa dan ditandatangani sebagai bukti penerimaan.",
        notes: null,
        closingNote: "Demikian surat jalan ini kami sampaikan. Atas kerjasamanya kami ucapkan terima kasih.",
        signatoryName: invoice.signatoryName ?? settings.defaultSignatoryName ?? null,
        signatoryTitle: invoice.signatoryTitle ?? settings.defaultSignatoryTitle ?? null,
        status: "Draft",
        createdAt: new Date(),
      }).returning({ id: deliveryOrders.id });

      const createdId = inserted[0]?.id;
      if (!createdId) throw new Error("Gagal membuat surat jalan");

      await tx.insert(deliveryOrderItems).values(items.map((item) => ({
        deliveryOrderId: createdId,
        description: item.description,
        qty: item.qty,
        unit: item.unit ?? "Unit",
        serialNumber: null,
        notes: null,
      })));

      return createdId;
    });

    await audit({ userId: user.id, action: "delivery_order.from_invoice", entity: "delivery_order", entityId: newId, payload: { invoiceId } });
    return NextResponse.json({ ok: true, deliveryOrderId: newId, data: await getDeliveryOrders() });
  } catch (error) {
    return toErrorResponse(error, "Gagal bikin surat jalan dari tagihan");
  }
}
