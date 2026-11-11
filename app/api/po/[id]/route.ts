import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clientPoItems, clientPos, deliveryOrders, invoices, supplierPos } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { parseMoneyInput } from "@/lib/money";
import { getClientPoDetail } from "@/lib/po";
import { cekNilaiPoCukup, cekNomorPoKlien } from "@/lib/cegah-dobel";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin", "finance", "sales", "project_manager"]);
    const { id } = await params;
    const detail = await getClientPoDetail(ensurePositiveInt(id, "id"));
    if (!detail) return NextResponse.json({ error: "PO tidak ditemukan" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (error) {
    return toErrorResponse(error, "Gagal memuat PO");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales", "finance"]);
    const { id } = await params;
    const poId = ensurePositiveInt(id, "id");
    const po = await db.query.clientPos.findFirst({ where: eq(clientPos.id, poId) });
    ensure(po, "PO tidak ditemukan");
    const body = await request.json();
    const set: Partial<typeof clientPos.$inferInsert> = {};
    if (body.poNumber !== undefined) {
      const n = trimString(body.poNumber, 100);
      ensure(n, "Nomor PO wajib diisi");
      set.poNumber = n;
    }
    if (body.poDate) set.poDate = new Date(body.poDate);
    if (body.value !== undefined) set.value = parseMoneyInput(body.value);
    if (body.fileUrl !== undefined) set.fileUrl = nullableTrim(body.fileUrl, 500);
    if (body.notes !== undefined) set.notes = nullableTrim(body.notes, 2000);
    if (body.closed !== undefined) set.closedAt = body.closed ? new Date() : null;
    await db.transaction(async (tx) => {
      await tx.update(clientPos).set(set).where(eq(clientPos.id, poId));
      if (set.poNumber) await cekNomorPoKlien(tx, po.clientId, set.poNumber, poId);
      if (set.value !== undefined) await cekNilaiPoCukup(tx, poId, set.value ?? 0);
    });
    await audit({ userId: user.id, action: body.closed === undefined ? "client_po.update" : body.closed ? "client_po.close" : "client_po.reopen", entity: "client_po", entityId: poId, payload: { ...set } as Record<string, unknown> });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "Gagal menyimpan PO");
  }
}

// Hapus cuma boleh kalau PO belum dipakai (belum ada surat jalan, tagihan, atau PO supplier).
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin"]);
    const { id } = await params;
    const poId = ensurePositiveInt(id, "id");
    const [sj, inv, sup] = await Promise.all([
      db.query.deliveryOrders.findFirst({ where: eq(deliveryOrders.clientPoId, poId) }),
      db.query.invoices.findFirst({ where: eq(invoices.clientPoId, poId) }),
      db.query.supplierPos.findFirst({ where: eq(supplierPos.clientPoId, poId) }),
    ]);
    ensure(!sj && !inv && !sup, "PO ini udah punya surat jalan, tagihan, atau PO supplier. Gak bisa dihapus, tutup aja.");
    await db.transaction(async (tx) => {
      await tx.delete(clientPoItems).where(eq(clientPoItems.clientPoId, poId));
      await tx.delete(clientPos).where(eq(clientPos.id, poId));
    });
    await audit({ userId: user.id, action: "client_po.delete", entity: "client_po", entityId: poId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "Gagal menghapus PO");
  }
}
