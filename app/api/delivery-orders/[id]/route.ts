import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { deliveryOrderItems, deliveryOrders } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getDeliveryOrders } from "@/lib/data-delivery";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales", "project_manager"]);
    const { id } = await params;
    const deliveryId = ensurePositiveInt(id, "delivery order id");
    const body = await request.json();
    const items = (Array.isArray(body.items) ? body.items : []) as Array<{
      description?: string;
      qty?: number | string;
      unit?: string | null;
      serialNumber?: string | null;
      notes?: string | null;
    }>;
    ensure(items.length > 0, "Minimal satu item barang");

    await db.transaction(async (tx) => {
      await tx.update(deliveryOrders).set({
        clientId: ensurePositiveInt(body.clientId, "clientId"),
        projectId: body.projectId ? ensurePositiveInt(body.projectId, "projectId") : null,
        invoiceId: body.invoiceId ? ensurePositiveInt(body.invoiceId, "invoiceId") : null,
        quotationId: body.quotationId ? ensurePositiveInt(body.quotationId, "quotationId") : null,
        date: body.date ? new Date(body.date) : new Date(),
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
      }).where(eq(deliveryOrders.id, deliveryId));

      await tx.delete(deliveryOrderItems).where(eq(deliveryOrderItems.deliveryOrderId, deliveryId));
      await tx.insert(deliveryOrderItems).values(items.map((item) => ({
        deliveryOrderId: deliveryId,
        description: trimString(item.description, 1000),
        qty: Math.max(1, Number(item.qty ?? 0) || 1),
        unit: trimString(item.unit ?? "", 50) || "Unit",
        serialNumber: nullableTrim(item.serialNumber, 200),
        notes: nullableTrim(item.notes, 500),
      })));
    });

    await audit({ userId: user.id, action: "delivery_order.update", entity: "delivery_order", entityId: deliveryId });
    return NextResponse.json({ ok: true, data: await getDeliveryOrders() });
  } catch (error) {
    return toErrorResponse(error, "Gagal simpan surat jalan");
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales", "project_manager"]);
    const { id } = await params;
    const deliveryId = ensurePositiveInt(id, "delivery order id");
    await db.transaction(async (tx) => {
      await tx.delete(deliveryOrderItems).where(eq(deliveryOrderItems.deliveryOrderId, deliveryId));
      await tx.delete(deliveryOrders).where(eq(deliveryOrders.id, deliveryId));
    });
    await audit({ userId: user.id, action: "delivery_order.delete", entity: "delivery_order", entityId: deliveryId });
    return NextResponse.json({ ok: true, data: await getDeliveryOrders() });
  } catch (error) {
    return toErrorResponse(error, "Gagal hapus surat jalan");
  }
}
