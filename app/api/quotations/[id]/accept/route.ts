import { NextRequest, NextResponse } from "next/server";

import { ensurePositiveInt, toErrorResponse } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { acceptQuotationAndCreateProject, createInvoiceFromQuotation } from "@/lib/business";
import { createNotification } from "@/lib/notifications";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales"]);
    const { id } = await params;
    const quotationId = ensurePositiveInt(id, "quotation id");

    const project = await acceptQuotationAndCreateProject(quotationId);
    const invoice = await createInvoiceFromQuotation(quotationId);
    await createNotification({ title: "Quotation accepted", message: `Quotation #${quotationId} berhasil diubah menjadi project #${project.projectId} dan invoice #${invoice.invoiceId}.`, type: "success", targetRole: "sales" });
    await audit({ userId: user.id, action: "quotation.accept", entity: "quotation", entityId: quotationId, payload: { projectId: project.projectId, invoiceId: invoice.invoiceId } });

    return NextResponse.json({
      ok: true,
      quotationId,
      projectId: project.projectId,
      invoiceId: invoice.invoiceId,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to accept quotation");
  }
}
