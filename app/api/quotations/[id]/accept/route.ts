import { NextRequest, NextResponse } from "next/server";

import { acceptQuotationAndCreateProject, createInvoiceFromQuotation } from "@/lib/business";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quotationId = Number(id);

    const project = await acceptQuotationAndCreateProject(quotationId);
    const invoice = await createInvoiceFromQuotation(quotationId);

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
