import { NextRequest, NextResponse } from "next/server";

import { ensurePositiveInt, toErrorResponse } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { acceptQuotationAndCreateProject, createInvoiceFromQuotation } from "@/lib/business";
import { createNotification } from "@/lib/notifications";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotations } from "@/db/schema";
import { nomorDokumen } from "@/lib/nomor-dokumen";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales"]);
    const { id } = await params;
    const quotationId = ensurePositiveInt(id, "quotation id");

    const project = await acceptQuotationAndCreateProject(quotationId);
    const q = await db.query.quotations.findFirst({ where: eq(quotations.id, quotationId) });
    const nomorPenawaran = q ? nomorDokumen("SP", q.id, q.nomor, q.date) : `#${quotationId}`;
    const invoice = await createInvoiceFromQuotation(quotationId);
    await createNotification({ title: "Penawaran diterima", message: `Penawaran ${nomorPenawaran} diterima: proyek #${project.projectId} dan tagihan ${invoice.nomor ?? `#${invoice.invoiceId}`} dibikin.`, type: "success", targetRole: "sales" });
    await audit({ userId: user.id, action: "quotation.accept", entity: "quotation", entityId: quotationId, payload: { projectId: project.projectId, invoiceId: invoice.invoiceId } });

    return NextResponse.json({
      ok: true,
      quotationId,
      projectId: project.projectId,
      invoiceId: invoice.invoiceId,
    });
  } catch (error) {
    return toErrorResponse(error, "Gagal menerima penawaran");
  }
}
