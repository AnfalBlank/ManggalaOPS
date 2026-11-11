import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { clientPoItems, clientPos, deliveryOrders, invoices, quotationItems, quotations } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { acceptQuotationAndCreateProject } from "@/lib/business";
import { parseMoneyInput } from "@/lib/money";
import { createNotification } from "@/lib/notifications";
import { getClientPoList } from "@/lib/po";
import { cekNomorPoKlien } from "@/lib/cegah-dobel";

export async function GET() {
  try {
    await requireRole(["admin", "finance", "sales", "project_manager"]);
    return NextResponse.json(await getClientPoList());
  } catch (error) {
    return toErrorResponse(error, "Gagal memuat PO");
  }
}

// Catat PO / kontrak klien untuk satu penawaran (1 penawaran = 1 PO). Penawaran jadi Accepted dan proyek
// dibuat kalau belum ada, tapi tagihan TIDAK dibuat otomatis: tagihan dibuat dari halaman PO.
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "sales", "finance"]);
    const body = await request.json();
    const quotationId = ensurePositiveInt(body.quotationId, "Penawaran");
    const poNumber = trimString(body.poNumber, 100);
    ensure(poNumber, "Nomor PO / kontrak klien wajib diisi");
    const poDate = body.poDate ? new Date(body.poDate) : null;
    ensure(poDate && !Number.isNaN(poDate.getTime()), "Tanggal PO wajib diisi");

    const quotation = await db.query.quotations.findFirst({ where: eq(quotations.id, quotationId) });
    ensure(quotation, "Penawaran tidak ditemukan");
    const ada = await db.query.clientPos.findFirst({ where: eq(clientPos.quotationId, quotationId) });
    ensure(!ada, `Penawaran ini udah punya PO (${ada?.poNumber})`);
    await cekNomorPoKlien(db, quotation.clientId, poNumber);

    const { projectId } = await acceptQuotationAndCreateProject(quotationId);
    const value = body.value !== undefined && body.value !== "" ? parseMoneyInput(body.value) : (quotation.total ?? 0);
    const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));

    const poId = await db.transaction(async (tx) => {
      const [po] = await tx
        .insert(clientPos)
        .values({
          quotationId,
          clientId: quotation.clientId,
          projectId,
          poNumber,
          poDate,
          value,
          fileUrl: nullableTrim(body.fileUrl, 500),
          notes: nullableTrim(body.notes, 2000),
          createdBy: user.id,
          createdAt: new Date(),
        })
        .returning({ id: clientPos.id });
      await cekNomorPoKlien(tx, quotation.clientId, poNumber, po.id);
      if (items.length) {
        await tx.insert(clientPoItems).values(
          items.map((i) => ({ clientPoId: po.id, description: i.description, qty: i.qty, unit: i.unit ?? "Unit", unitPrice: i.unitPrice, unitCost: i.unitCost ?? 0, amount: i.amount })),
        );
      }
      // Tagihan & surat jalan lama dari penawaran yang sama disambungkan ke PO ini.
      await tx.update(invoices).set({ clientPoId: po.id }).where(and(eq(invoices.quotationId, quotationId), isNull(invoices.clientPoId)));
      await tx.update(deliveryOrders).set({ clientPoId: po.id }).where(and(eq(deliveryOrders.quotationId, quotationId), isNull(deliveryOrders.clientPoId)));
      return po.id;
    });

    await createNotification({ title: "PO klien masuk", message: `PO ${poNumber} dicatat untuk QUO-${String(quotationId).padStart(4, "0")}.`, type: "success", targetRole: "finance" });
    await audit({ userId: user.id, action: "client_po.create", entity: "client_po", entityId: poId, payload: { quotationId, poNumber, value } });
    return NextResponse.json({ ok: true, id: poId });
  } catch (error) {
    return toErrorResponse(error, "Gagal mencatat PO");
  }
}
