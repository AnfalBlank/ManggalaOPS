import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { clientPos, deliveryOrderItems, deliveryOrders } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { getDeliveryOrders } from "@/lib/data-delivery";
import { isiNomorKosong } from "@/lib/nomor-dokumen";

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

    const sj = await db.query.deliveryOrders.findFirst({ where: eq(deliveryOrders.id, deliveryId) });
    ensure(sj, "Surat jalan tidak ditemukan");
    // Surat jalan dari PO: barang & jumlahnya nyambung ke sisa PO, jadi gak boleh diganti di sini (dulu sambungannya
    // ilang pas disimpan, sisa PO jadi salah). Yang boleh diubah: kepala surat, no. seri, catatan.
    const barisLama = sj.clientPoId ? await db.select().from(deliveryOrderItems).where(eq(deliveryOrderItems.deliveryOrderId, deliveryId)).orderBy(asc(deliveryOrderItems.id)) : [];
    const dariPo = barisLama.some((b) => b.clientPoItemId);
    if (dariPo) {
      const sama =
        barisLama.length === items.length &&
        barisLama.every((b, i) => b.description.trim() === trimString(items[i].description, 1000) && b.qty === Math.max(1, Number(items[i].qty ?? 0) || 1));
      ensure(sama, "Barang & jumlah di surat jalan dari PO gak bisa diubah di sini. Ubah status jadi Batal, lalu bikin surat jalan baru dari halaman PO.");
      const po = await db.query.clientPos.findFirst({ where: eq(clientPos.id, sj.clientPoId!) });
      ensure(!po || po.clientId === ensurePositiveInt(body.clientId, "clientId"), "Surat jalan ini nyambung ke PO klien, kliennya gak bisa diganti");
    }

    await db.transaction(async (tx) => {
      // Surat jalan dari CRM versi lama yang belum punya nomor tersimpan dikunci dulu sebelum tanggalnya diubah.
      await isiNomorKosong(tx, "SJ");
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

      if (dariPo) {
        for (const [i, b] of barisLama.entries()) {
          await tx.update(deliveryOrderItems).set({ serialNumber: nullableTrim(items[i].serialNumber, 200), notes: nullableTrim(items[i].notes, 500), unit: trimString(items[i].unit ?? "", 50) || b.unit || "Unit" }).where(eq(deliveryOrderItems.id, b.id));
        }
        return;
      }
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
