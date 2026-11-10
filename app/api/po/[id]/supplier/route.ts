import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clientPos, supplierPoItems, supplierPos } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { parseMoneyInput } from "@/lib/money";
import { computeOutputTax, normalizeTaxPercent } from "@/lib/output-tax";

// PO keluar ke supplier untuk memenuhi PO klien.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance", "sales"]);
    const { id } = await params;
    const poId = ensurePositiveInt(id, "id");
    const po = await db.query.clientPos.findFirst({ where: eq(clientPos.id, poId) });
    ensure(po, "PO klien tidak ditemukan");

    const body = await request.json();
    const supplierName = trimString(body.supplierName, 200);
    ensure(supplierName, "Nama supplier wajib diisi");
    const items = (Array.isArray(body.items) ? body.items : [])
      .map((i: { description?: string; qty?: number | string; unit?: string; unitPrice?: number | string }) => {
        const qty = Math.floor(Number(i.qty) || 0);
        const unitPrice = parseMoneyInput(i.unitPrice);
        return { description: trimString(i.description, 1000), qty, unit: trimString(i.unit, 50) || "Unit", unitPrice, amount: qty * unitPrice };
      })
      .filter((i: { description: string; qty: number }) => i.description && i.qty > 0) as { description: string; qty: number; unit: string; unitPrice: number; amount: number }[];
    ensure(items.length > 0, "Isi minimal satu barang");

    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const { tax, total } = computeOutputTax(subtotal, normalizeTaxPercent(body.taxPercent, 11));
    const supId = await db.transaction(async (tx) => {
      const [sup] = await tx
        .insert(supplierPos)
        .values({
          clientPoId: poId,
          supplierName,
          supplierContact: nullableTrim(body.supplierContact, 200),
          supplierPhone: nullableTrim(body.supplierPhone, 50),
          supplierAddress: nullableTrim(body.supplierAddress, 500),
          date: body.date ? new Date(body.date) : new Date(),
          expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
          paymentTerms: nullableTrim(body.paymentTerms, 200),
          notes: nullableTrim(body.notes, 2000),
          subtotal,
          tax,
          total,
          status: "Draft",
          createdBy: user.id,
          createdAt: new Date(),
        })
        .returning({ id: supplierPos.id });
      await tx.insert(supplierPoItems).values(items.map((i) => ({ ...i, supplierPoId: sup.id })));
      return sup.id;
    });
    await audit({ userId: user.id, action: "supplier_po.create", entity: "supplier_po", entityId: supId, payload: { clientPoId: poId, supplierName, total } });
    return NextResponse.json({ ok: true, id: supId });
  } catch (error) {
    return toErrorResponse(error, "Gagal membuat PO supplier");
  }
}
