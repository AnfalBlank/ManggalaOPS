import { RoleGuard } from "@/components/auth/guard";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { getAppSettings } from "@/lib/settings";

export default async function SettingsPage() {
  const settingsRow = await getAppSettings();
  const settings = {
    companyName: settingsRow.companyName,
    companyEmail: settingsRow.companyEmail ?? "",
    companyPhone: settingsRow.companyPhone ?? "",
    companyAddress: settingsRow.companyAddress ?? "",
    defaultTaxPercent: settingsRow.defaultTaxPercent ?? 11,
    quotationValidityDays: settingsRow.quotationValidityDays ?? 7,
    invoiceDueDays: settingsRow.invoiceDueDays ?? 14,
    defaultPaymentMethod: settingsRow.defaultPaymentMethod ?? "CBD",
    defaultSignatoryName: settingsRow.defaultSignatoryName ?? "Muhammad Hidayat",
    defaultSignatoryTitle: settingsRow.defaultSignatoryTitle ?? "Direktur",
    defaultCashAccountCode: settingsRow.defaultCashAccountCode ?? "1001",
    defaultBankMandiriAccountCode: settingsRow.defaultBankMandiriAccountCode ?? "1002",
    defaultBankBcaAccountCode: settingsRow.defaultBankBcaAccountCode ?? "1003",
    defaultReceivableAccountCode: settingsRow.defaultReceivableAccountCode ?? "1101",
    defaultFixedAssetAccountCode: settingsRow.defaultFixedAssetAccountCode ?? "1201",
    defaultLiabilityAccountCode: settingsRow.defaultLiabilityAccountCode ?? "2001",
    defaultEquityAccountCode: settingsRow.defaultEquityAccountCode ?? "3001",
    defaultProjectRevenueAccountCode: settingsRow.defaultProjectRevenueAccountCode ?? "4001",
    defaultNonProjectRevenueAccountCode: settingsRow.defaultNonProjectRevenueAccountCode ?? "4002",
    defaultOperationalExpenseAccountCode: settingsRow.defaultOperationalExpenseAccountCode ?? "5001",
    defaultProjectExpenseAccountCode: settingsRow.defaultProjectExpenseAccountCode ?? "5002",
    financeApprovalRequired: settingsRow.financeApprovalRequired ?? true,
    allowUserSelfReset: settingsRow.allowUserSelfReset ?? false,
  };

  return (
    <PageWrapper>
      <RoleGuard allow={["admin"]}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Settings</h1>
          <p className="text-muted-foreground mt-1">Pengaturan sistem dasar untuk ManggalaOPS.</p>
        </div>

        <SettingsPanel initialSettings={settings} />
      </RoleGuard>
    </PageWrapper>
  );
}
