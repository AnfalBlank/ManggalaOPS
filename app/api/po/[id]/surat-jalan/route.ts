import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clientPos, deliveryOrderItems, deliveryOrders } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { getClientPoItems } from "@/lib/po";
import { getAppSettings } from "@/lib/settings";

// Bikin surat jalan dari PO klien. Jumlah per barang gak boleh lebih dari sisa yang belum dikirim.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales", "project_manager"]);
    const { id } = await params;
    const poId = ensurePositiveInt(id, "id");
    const po = await db.query.clientPos.findFirst({ where: eq(clientPos.id, poId) });
    ensure(po, "PO tidak ditemukan");
    ensure(!po.closedAt, "PO ini udah ditutup");

    const body = await request.json();
    const poItems = await getClientPoItems(poId);
    const minta = (Array.isArray(body.items) ? body.items : []) as Array<{ clientPoItemId: number; qty: number | string; serialNumber?: string }>;
    const baris: { itemId: number; description: string; unit: string; qty: number; serialNumber: string | null }[] = [];
    for (const m of minta) {
      const qty = Math.floor(Number(m.qty) || 0);
      if (qty <= 0) continue;
      const item = poItems.find((i) => i.id === Number(m.clientPoItemId));
      ensure(item, "Barang gak ada di PO ini");
      const sisa = item.qty - item.dikirim;
      ensure(qty <= sisa, `"${item.description.split("\n")[0]}" sisa ${sisa} ${item.unit}, gak bisa kirim ${qty}`);
      baris.push({ itemId: item.id, description: item.description, unit: item.unit, qty, serialNumber: nullableTrim(m.serialNumber, 200) });
    }
    ensure(baris.length > 0, "Isi jumlah barang yang dikirim");

    const settings = await getAppSettings();
    const sjId = await db.transaction(async (tx) => {
      const [sj] = await tx
        .insert(deliveryOrders)
        .values({
          clientId: po.clientId,
          projectId: po.projectId,
          quotationId: po.quotationId,
          clientPoId: poId,
          date: body.date ? new Date(body.date) : new Date(),
          vehicleNumber: nullableTrim(body.vehicleNumber, 50),
          driverName: nullableTrim(body.driverName, 200),
          shippingMethod: nullableTrim(body.shippingMethod, 100),
          recipientName: nullableTrim(body.recipientName, 200),
          recipientCompany: nullableTrim(body.recipientCompany, 200),
          recipientAddress: nullableTrim(body.recipientAddress, 500),
          recipientPhone: nullableTrim(body.recipientPhone, 50),
          subject: "Surat Jalan",
          notes: nullableTrim(body.notes, 2000),
          signatoryName: nullableTrim(body.signatoryName, 200) ?? settings.defaultSignatoryName ?? null,
          signatoryTitle: nullableTrim(body.signatoryTitle, 200) ?? settings.defaultSignatoryTitle ?? null,
          status: "Draft",
          createdAt: new Date(),
        })
        .returning({ id: deliveryOrders.id });
      await tx.insert(deliveryOrderItems).values(
        baris.map((b) => ({ deliveryOrderId: sj.id, clientPoItemId: b.itemId, description: b.description, qty: b.qty, unit: b.unit, serialNumber: b.serialNumber })),
      );
      return sj.id;
    });

    await createNotification({ title: "Surat jalan dibuat", message: `SJ-${String(sjId).padStart(4, "0")} untuk PO ${po.poNumber}.`, type: "info", targetRole: "finance" });
    await audit({ userId: user.id, action: "delivery_order.create_from_po", entity: "delivery_order", entityId: sjId, payload: { clientPoId: poId } });
    return NextResponse.json({ ok: true, id: sjId });
  } catch (error) {
    return toErrorResponse(error, "Gagal membuat surat jalan");
  }
}
