import { getAppSettings } from "@/lib/settings";

export async function getAccountMapping() {
  const settings = await getAppSettings();
  return {
    cash: settings.defaultCashAccountCode || "1001",
    bankMandiri: settings.defaultBankMandiriAccountCode || "1002",
    bankBca: settings.defaultBankBcaAccountCode || "1003",
    receivable: settings.defaultReceivableAccountCode || "1101",
    fixedAsset: settings.defaultFixedAssetAccountCode || "1201",
    liability: settings.defaultLiabilityAccountCode || "2001",
    equity: settings.defaultEquityAccountCode || "3001",
    projectRevenue: settings.defaultProjectRevenueAccountCode || "4001",
    nonProjectRevenue: settings.defaultNonProjectRevenueAccountCode || "4002",
    operationalExpense: settings.defaultOperationalExpenseAccountCode || "5001",
    projectExpense: settings.defaultProjectExpenseAccountCode || "5002",
  };
}
