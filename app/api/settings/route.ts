import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getAppSettings } from "@/lib/settings";

export async function GET() {
  try {
    await requireRole(["admin"]);
    return NextResponse.json(await getAppSettings());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(["admin"]);
    const body = await request.json();
    const current = await db.query.appSettings.findFirst({ orderBy: desc(appSettings.id) });

    const payload = {
      companyName: String(body.companyName ?? "PT. Manggala Utama Indonesia").trim() || "PT. Manggala Utama Indonesia",
      companyEmail: String(body.companyEmail ?? "").trim() || null,
      companyPhone: String(body.companyPhone ?? "").trim() || null,
      companyAddress: String(body.companyAddress ?? "").trim() || null,
      defaultTaxPercent: Number(body.defaultTaxPercent ?? 11) || 11,
      quotationValidityDays: Number(body.quotationValidityDays ?? 7) || 7,
      invoiceDueDays: Number(body.invoiceDueDays ?? 14) || 14,
      defaultPaymentMethod: String(body.defaultPaymentMethod ?? "CBD").trim() || "CBD",
      defaultSignatoryName: String(body.defaultSignatoryName ?? "Muhammad Hidayat").trim() || "Muhammad Hidayat",
      defaultSignatoryTitle: String(body.defaultSignatoryTitle ?? "Direktur").trim() || "Direktur",
      defaultCashAccountCode: String(body.defaultCashAccountCode ?? "1001").trim() || "1001",
      defaultBankMandiriAccountCode: String(body.defaultBankMandiriAccountCode ?? "1002").trim() || "1002",
      defaultBankBcaAccountCode: String(body.defaultBankBcaAccountCode ?? "1003").trim() || "1003",
      defaultReceivableAccountCode: String(body.defaultReceivableAccountCode ?? "1101").trim() || "1101",
      defaultFixedAssetAccountCode: String(body.defaultFixedAssetAccountCode ?? "1201").trim() || "1201",
      defaultLiabilityAccountCode: String(body.defaultLiabilityAccountCode ?? "2001").trim() || "2001",
      defaultEquityAccountCode: String(body.defaultEquityAccountCode ?? "3001").trim() || "3001",
      defaultProjectRevenueAccountCode: String(body.defaultProjectRevenueAccountCode ?? "4001").trim() || "4001",
      defaultNonProjectRevenueAccountCode: String(body.defaultNonProjectRevenueAccountCode ?? "4002").trim() || "4002",
      defaultOperationalExpenseAccountCode: String(body.defaultOperationalExpenseAccountCode ?? "5001").trim() || "5001",
      defaultProjectExpenseAccountCode: String(body.defaultProjectExpenseAccountCode ?? "5002").trim() || "5002",
      financeApprovalRequired: Boolean(body.financeApprovalRequired),
      allowUserSelfReset: Boolean(body.allowUserSelfReset),
      updatedAt: new Date(),
    };

    if (current?.id) {
      await db.update(appSettings).set(payload).where(eq(appSettings.id, current.id));
    } else {
      await db.insert(appSettings).values(payload);
    }

    return NextResponse.json({ ok: true, data: await getAppSettings() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save settings" }, { status: 500 });
  }
}
