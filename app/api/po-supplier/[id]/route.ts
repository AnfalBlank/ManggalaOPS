import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { supplierPoItems, supplierPos } from "@/db/schema";
import { ensure, ensurePositiveInt, toErrorResponse } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { STATUS_PO_SUPPLIER } from "@/lib/po";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance", "sales"]);
    const { id } = await params;
    const supId = ensurePositiveInt(id, "id");
    const body = await request.json();
    const status = String(body.status ?? "");
    ensure((STATUS_PO_SUPPLIER as readonly string[]).includes(status), "Status gak dikenal");
    await db.update(supplierPos).set({ status }).where(eq(supplierPos.id, supId));
    await audit({ userId: user.id, action: "supplier_po.status", entity: "supplier_po", entityId: supId, payload: { status } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "Gagal mengubah status");
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance", "sales"]);
    const { id } = await params;
    const supId = ensurePositiveInt(id, "id");
    const sup = await db.query.supplierPos.findFirst({ where: eq(supplierPos.id, supId) });
    ensure(sup, "PO supplier tidak ditemukan");
    ensure(sup.status === "Draft", "Cuma PO supplier yang masih Draft yang bisa dihapus. Yang udah dikirim, ganti status jadi Batal.");
    await db.transaction(async (tx) => {
      await tx.delete(supplierPoItems).where(eq(supplierPoItems.supplierPoId, supId));
      await tx.delete(supplierPos).where(eq(supplierPos.id, supId));
    });
    await audit({ userId: user.id, action: "supplier_po.delete", entity: "supplier_po", entityId: supId, payload: { supplierName: sup.supplierName } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "Gagal menghapus PO supplier");
  }
}
