"use client";

import { useState } from "react";
import { Settings2, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SettingsData = {
  companyName: string;
  companyEmail: string | null;
  companyPhone: string | null;
  companyAddress: string | null;
  defaultTaxPercent: number;
  quotationValidityDays: number;
  invoiceDueDays: number;
  defaultPaymentMethod: string;
  defaultSignatoryName: string;
  defaultSignatoryTitle: string;
  defaultCashAccountCode: string;
  defaultBankMandiriAccountCode: string;
  defaultBankBcaAccountCode: string;
  defaultReceivableAccountCode: string;
  defaultFixedAssetAccountCode: string;
  defaultLiabilityAccountCode: string;
  defaultEquityAccountCode: string;
  defaultProjectRevenueAccountCode: string;
  defaultNonProjectRevenueAccountCode: string;
  defaultOperationalExpenseAccountCode: string;
  defaultProjectExpenseAccountCode: string;
  financeApprovalRequired: boolean;
  allowUserSelfReset: boolean;
};

const accountOptions = [
  { code: "1001", name: "Kas" },
  { code: "1002", name: "Bank Mandiri" },
  { code: "1003", name: "Bank BCA" },
  { code: "1101", name: "Piutang Usaha" },
  { code: "1201", name: "Aset Tetap" },
  { code: "2001", name: "Hutang Usaha" },
  { code: "3001", name: "Modal" },
  { code: "4001", name: "Pendapatan Project" },
  { code: "4002", name: "Pendapatan Non Project" },
  { code: "5001", name: "Beban Operasional" },
  { code: "5002", name: "Beban Project" },
];

export function SettingsPanel({ initialSettings }: { initialSettings: SettingsData }) {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Gagal simpan settings");
      setSettings(payload.data);
      toast.success("Settings berhasil disimpan ke database");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal simpan settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="size-5 text-primary" /> General</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid gap-2"><Label>Nama Perusahaan</Label><Input value={settings.companyName} onChange={(e) => update("companyName", e.target.value)} /></div>
          <div className="grid gap-2"><Label>Email Perusahaan</Label><Input value={settings.companyEmail ?? ""} onChange={(e) => update("companyEmail", e.target.value)} /></div>
          <div className="grid gap-2"><Label>Telepon</Label><Input value={settings.companyPhone ?? ""} onChange={(e) => update("companyPhone", e.target.value)} /></div>
          <div className="grid gap-2"><Label>Alamat</Label><Textarea rows={4} value={settings.companyAddress ?? ""} onChange={(e) => update("companyAddress", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserCog className="size-5 text-primary" /> Sales, Billing & Mapping</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid gap-2"><Label>Default Pajak (%)</Label><Input type="number" value={settings.defaultTaxPercent} onChange={(e) => update("defaultTaxPercent", Number(e.target.value) || 0)} /></div>
          <div className="grid gap-2"><Label>Quotation Validity (hari)</Label><Input type="number" value={settings.quotationValidityDays} onChange={(e) => update("quotationValidityDays", Number(e.target.value) || 0)} /></div>
          <div className="grid gap-2"><Label>Invoice Due (hari)</Label><Input type="number" value={settings.invoiceDueDays} onChange={(e) => update("invoiceDueDays", Number(e.target.value) || 0)} /></div>
          <div className="grid gap-2"><Label>Default Payment Method</Label><Select value={settings.defaultPaymentMethod} onValueChange={(value) => update("defaultPaymentMethod", value ?? "CBD")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CBD">CBD</SelectItem><SelectItem value="Term">Term</SelectItem><SelectItem value="Transfer">Transfer</SelectItem></SelectContent></Select></div>
          <div className="grid gap-2"><Label>Nama Penanda Tangan Default</Label><Input value={settings.defaultSignatoryName} onChange={(e) => update("defaultSignatoryName", e.target.value)} /></div>
          <div className="grid gap-2"><Label>Jabatan Penanda Tangan Default</Label><Input value={settings.defaultSignatoryTitle} onChange={(e) => update("defaultSignatoryTitle", e.target.value)} /></div>
          {[
            ["Akun Kas Default", "defaultCashAccountCode"],
            ["Akun Bank Mandiri", "defaultBankMandiriAccountCode"],
            ["Akun Bank BCA", "defaultBankBcaAccountCode"],
            ["Akun Piutang", "defaultReceivableAccountCode"],
            ["Akun Aset Tetap", "defaultFixedAssetAccountCode"],
            ["Akun Kewajiban", "defaultLiabilityAccountCode"],
            ["Akun Ekuitas", "defaultEquityAccountCode"],
            ["Akun Pendapatan Project", "defaultProjectRevenueAccountCode"],
            ["Akun Pendapatan Non-Project", "defaultNonProjectRevenueAccountCode"],
            ["Akun Beban Operasional", "defaultOperationalExpenseAccountCode"],
            ["Akun Beban Project", "defaultProjectExpenseAccountCode"],
          ].map(([label, key]) => (
            <div className="grid gap-2" key={key}><Label>{label}</Label><Select value={settings[key as keyof SettingsData] as string} onValueChange={(value) => update(key as keyof SettingsData, value as never)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{accountOptions.map((account) => <SelectItem key={account.code} value={account.code}>{account.code} - {account.name}</SelectItem>)}</SelectContent></Select></div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Security</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <label className="flex items-center justify-between gap-4"><div><Label>Finance Approval</Label><p className="text-xs text-muted-foreground">Wajib approval manual untuk perubahan finance penting.</p></div><input type="checkbox" checked={settings.financeApprovalRequired} onChange={(e) => update("financeApprovalRequired", e.target.checked)} className="h-4 w-4" /></label>
          <label className="flex items-center justify-between gap-4"><div><Label>User Self Reset</Label><p className="text-xs text-muted-foreground">Izinkan user reset password sendiri.</p></div><input type="checkbox" checked={settings.allowUserSelfReset} onChange={(e) => update("allowUserSelfReset", e.target.checked)} className="h-4 w-4" /></label>
          <div className="pt-4 flex flex-col gap-2"><Button disabled={saving} onClick={save}>{saving ? "Menyimpan..." : "Simpan Settings"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
