import { desc } from "drizzle-orm";

import { db } from "@/db";
import { appSettings } from "@/db/schema";

export async function getAppSettings() {
  const row = await db.query.appSettings.findFirst({ orderBy: desc(appSettings.id) });

  return row ?? {
    id: 0,
    companyName: "PT. Manggala Utama Indonesia",
    companyEmail: "admin@manggala-utama.id",
    companyPhone: "+62 878-8424-1703",
    companyAddress: "Jakarta",
    defaultTaxPercent: 11,
    quotationValidityDays: 7,
    invoiceDueDays: 14,
    defaultPaymentMethod: "CBD",
    defaultSignatoryName: "Muhammad Hidayat",
    defaultSignatoryTitle: "Direktur",
    defaultCashAccountCode: "1001",
    defaultBankMandiriAccountCode: "1002",
    defaultBankBcaAccountCode: "1003",
    defaultReceivableAccountCode: "1101",
    defaultFixedAssetAccountCode: "1201",
    defaultLiabilityAccountCode: "2001",
    defaultEquityAccountCode: "3001",
    defaultProjectRevenueAccountCode: "4001",
    defaultNonProjectRevenueAccountCode: "4002",
    defaultOperationalExpenseAccountCode: "5001",
    defaultProjectExpenseAccountCode: "5002",
    financeApprovalRequired: true,
    allowUserSelfReset: false,
    updatedAt: new Date(),
  };
}
