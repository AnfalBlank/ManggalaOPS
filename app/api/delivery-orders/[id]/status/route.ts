import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { deliveryOrders } from "@/db/schema";
import { ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { cekSisaKirimPo } from "@/lib/cegah-dobel";

const VALID_STATUSES = ["Draft", "In Transit", "Delivered", "Cancelled"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireRole(["admin", "sales", "project_manager"]);
    const { id } = await params;
    const deliveryId = ensurePositiveInt(id, "delivery order id");
    const body = await request.json();
    const status = trimString(body.status, 50);
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Status tidak valid. Pilih: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    const sj = await db.query.deliveryOrders.findFirst({ where: eq(deliveryOrders.id, deliveryId) });
    if (!sj) return NextResponse.json({ error: "Surat jalan tidak ditemukan" }, { status: 404 });
    await db.transaction(async (tx) => {
      await tx.update(deliveryOrders).set({ status }).where(eq(deliveryOrders.id, deliveryId));
      // Surat jalan batal yang dihidupin lagi: barangnya kehitung lagi, jadi gak boleh lewat sisa PO.
      if (sj.clientPoId && sj.status === "Cancelled" && status !== "Cancelled") await cekSisaKirimPo(tx, sj.clientPoId);
    });
    await audit({ userId: user.id, action: "delivery_order.status_change", entity: "delivery_order", entityId: deliveryId, payload: { status } });
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return toErrorResponse(error, "Gagal ubah status surat jalan");
  }
}
