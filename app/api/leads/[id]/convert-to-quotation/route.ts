import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { leads, quotationItems, quotations } from "@/db/schema";
import { ensurePositiveInt, toErrorResponse } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { computeOutputTax, normalizeTaxPercent } from "@/lib/output-tax";
import { getAppSettings } from "@/lib/settings";
import { ambilNomor } from "@/lib/nomor-dokumen";

/**
 * Convert an existing Lead into a draft Quotation. The new quotation inherits
 * the client and the estimated value as a single line item; sales can then
 * refine items and totals before sending to the client.
 */
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "sales"]);
    const { id } = await params;
    const leadId = ensurePositiveInt(id, "lead id");

    const lead = await db.query.leads.findFirst({ where: eq(leads.id, leadId) });
    if (!lead) {
      return NextResponse.json({ error: "Calon klien tidak ditemukan" }, { status: 404 });
    }

    const settings = await getAppSettings();
    const validityDays = settings.quotationValidityDays ?? 7;
    const taxPercent = normalizeTaxPercent(settings.defaultTaxPercent, 11);
    const subtotal = Number(lead.estimatedValue ?? 0);
    const { tax, total } = computeOutputTax(subtotal, taxPercent);

    const quotationId = await db.transaction(async (tx) => {
      const tanggal = new Date();
      const nomor = await ambilNomor(tx, "SP", tanggal);
      const inserted = await tx.insert(quotations).values({
        nomor,
        clientId: lead.clientId,
        projectId: null,
        date: tanggal,
        validUntil: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
        paymentMethod: settings.defaultPaymentMethod ?? "CBD",
        subject: `Penawaran ${lead.serviceName}`,
        signatoryName: settings.defaultSignatoryName,
        signatoryTitle: settings.defaultSignatoryTitle,
        subtotal,
        tax,
        total,
        subtotalCost: 0,
        totalMargin: subtotal,
        marginPercentage: 100,
        status: "Draft",
      }).returning({ id: quotations.id });

      const newId = inserted[0]?.id;
      if (!newId) throw new Error("Gagal membuat penawaran");

      await tx.insert(quotationItems).values({
        quotationId: newId,
        description: lead.serviceName,
        qty: 1,
        unit: "Lot",
        unitPrice: subtotal,
        unitCost: 0,
        amount: subtotal,
      });

      // Mark the lead as Negotiation (active discussion phase) if still New/Follow Up.
      if (lead.status === "New" || lead.status === "Follow Up") {
        await tx.update(leads).set({ status: "Negotiation" }).where(eq(leads.id, leadId));
      }

      return newId;
    });

    await audit({ userId: user.id, action: "lead.convert_to_quotation", entity: "lead", entityId: leadId, payload: { quotationId } });
    return NextResponse.json({ ok: true, quotationId });
  } catch (error) {
    return toErrorResponse(error, "Gagal menjadikan calon klien penawaran");
  }
}
