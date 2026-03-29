import { NextRequest, NextResponse } from "next/server";

import { acceptQuotationAndCreateProject, createInvoiceFromQuotation } from "@/lib/business";
import { createNotification } from "@/lib/notifications";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quotationId = Number(id);

    const project = await acceptQuotationAndCreateProject(quotationId);
    const invoice = await createInvoiceFromQuotation(quotationId);
    await createNotification({ title: "Quotation accepted", message: `Quotation #${quotationId} berhasil diubah menjadi project #${project.projectId} dan invoice #${invoice.invoiceId}.`, type: "success", targetRole: "sales" });

    return NextResponse.json({
      ok: true,
      quotationId,
      projectId: project.projectId,
      invoiceId: invoice.invoiceId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to accept quotation" },
      { status: 500 },
    );
  }
}
