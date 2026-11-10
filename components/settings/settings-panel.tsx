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
  signatureImageUrl: string | null;
  stampImageUrl: string | null;
  quotationSignatoryName: string;
  quotationSignatoryTitle: string;
  quotationSignatureImageUrl: string | null;
};

type GambarKey = "signatureImageUrl" | "stampImageUrl" | "quotationSignatureImageUrl";

// Satu kolom upload gambar (ttd/stempel): pratinjau, pilih file, hapus.
function KolomGambar({ label, nilai, onUbah }: { label: string; nilai: string | null; onUbah: (url: string | null) => void }) {
  const [mengunggah, setMengunggah] = useState(false);
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {nilai ? (
          <img src={nilai.replace(/^\/uploads\//, "/api/uploads/")} alt={label} className="h-14 max-w-40 rounded border bg-white object-contain p-1" />
        ) : <span className="text-xs italic text-muted-foreground">Belum ada gambar</span>}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="text-xs"
          disabled={mengunggah}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setMengunggah(true);
            try {
              const form = new FormData();
              form.append("file", file);
              const res = await fetch("/api/upload", { method: "POST", body: form });
              const data = await res.json();
              if (!res.ok || !data.url) throw new Error(data.error ?? "Gagal upload gambar");
              onUbah(data.url);
              toast.success("Gambar terunggah. Tekan Simpan setelan biar kepakai.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal upload gambar");
            } finally {
              setMengunggah(false);
            }
          }}
        />
        {nilai ? <Button type="button" variant="outline" size="sm" onClick={() => onUbah(null)}>Hapus gambar</Button> : null}
      </div>
    </div>
  );
}

const accountOptions = [
  { code: "1001", name: "Kas", type: "Asset" },
  { code: "1002", name: "Bank Mandiri", type: "Asset" },
  { code: "1003", name: "Bank BCA", type: "Asset" },
  { code: "1101", name: "Piutang Usaha", type: "Asset" },
  { code: "1201", name: "Aset Tetap", type: "Asset" },
  { code: "2001", name: "Hutang Usaha", type: "Liability" },
  { code: "3001", name: "Modal", type: "Equity" },
  { code: "4001", name: "Pendapatan Project", type: "Revenue" },
  { code: "4002", name: "Pendapatan Non Project", type: "Revenue" },
  { code: "5001", name: "Beban Operasional", type: "Expense" },
  { code: "5002", name: "Beban Project", type: "Expense" },
];

export function SettingsPanel({ initialSettings, accountOptions: dbAccountOptions }: { initialSettings: SettingsData; accountOptions?: { code: string; name: string; type: string }[] }) {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [saving, setSaving] = useState(false);
  const accounts = dbAccountOptions && dbAccountOptions.length > 0 ? dbAccountOptions : accountOptions;

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
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Gagal nyimpen setelan");
      setSettings(payload.data);
      toast.success("Setelan disimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal nyimpen setelan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="size-5 text-primary" /> Data perusahaan</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid gap-2"><Label>Nama perusahaan</Label><Input value={settings.companyName} onChange={(e) => update("companyName", e.target.value)} /></div>
          <div className="grid gap-2"><Label>Email perusahaan</Label><Input value={settings.companyEmail ?? ""} onChange={(e) => update("companyEmail", e.target.value)} /></div>
          <div className="grid gap-2"><Label>Telepon</Label><Input value={settings.companyPhone ?? ""} onChange={(e) => update("companyPhone", e.target.value)} /></div>
          <div className="grid gap-2"><Label>Alamat</Label><Textarea rows={4} value={settings.companyAddress ?? ""} onChange={(e) => update("companyAddress", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserCog className="size-5 text-primary" /> Penawaran, tagihan & akun</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid gap-2"><Label>PPN bawaan (%)</Label><Input type="number" value={settings.defaultTaxPercent} onChange={(e) => update("defaultTaxPercent", Number(e.target.value) || 0)} /></div>
          <div className="grid gap-2"><Label>Masa berlaku penawaran (hari)</Label><Input type="number" value={settings.quotationValidityDays} onChange={(e) => update("quotationValidityDays", Number(e.target.value) || 0)} /></div>
          <div className="grid gap-2"><Label>Jatuh tempo tagihan (hari)</Label><Input type="number" value={settings.invoiceDueDays} onChange={(e) => update("invoiceDueDays", Number(e.target.value) || 0)} /></div>
          <div className="grid gap-2"><Label>Cara bayar bawaan</Label><Select value={settings.defaultPaymentMethod} onValueChange={(value) => update("defaultPaymentMethod", value ?? "CBD")}><SelectTrigger className="w-full"><SelectValue>{(v: string) => ({ CBD: "CBD (bayar sebelum kirim)", Term: "Tempo" } as Record<string, string>)[v] ?? v}</SelectValue></SelectTrigger><SelectContent><SelectItem value="CBD">CBD (bayar sebelum kirim)</SelectItem><SelectItem value="Term">Tempo</SelectItem><SelectItem value="Transfer">Transfer</SelectItem></SelectContent></Select></div>
          <div className="grid gap-2"><Label>Nama penanda tangan tagihan & kwitansi</Label><Input value={settings.defaultSignatoryName} onChange={(e) => update("defaultSignatoryName", e.target.value)} /></div>
          <div className="grid gap-2"><Label>Jabatan penanda tangan tagihan & kwitansi</Label><Input value={settings.defaultSignatoryTitle} onChange={(e) => update("defaultSignatoryTitle", e.target.value)} /></div>
          {[
            ["Akun kas", "defaultCashAccountCode"],
            ["Akun Bank Mandiri", "defaultBankMandiriAccountCode"],
            ["Akun Bank BCA", "defaultBankBcaAccountCode"],
            ["Akun piutang", "defaultReceivableAccountCode"],
            ["Akun aset tetap", "defaultFixedAssetAccountCode"],
            ["Akun utang", "defaultLiabilityAccountCode"],
            ["Akun modal", "defaultEquityAccountCode"],
            ["Akun pendapatan proyek", "defaultProjectRevenueAccountCode"],
            ["Akun pendapatan non-proyek", "defaultNonProjectRevenueAccountCode"],
            ["Akun beban operasional", "defaultOperationalExpenseAccountCode"],
            ["Akun beban proyek", "defaultProjectExpenseAccountCode"],
          ].map(([label, key]) => (
            <div className="grid gap-2" key={key}><Label>{label}</Label><Select value={settings[key as keyof SettingsData] as string} onValueChange={(value) => update(key as keyof SettingsData, value as never)}><SelectTrigger className="w-full"><SelectValue>{(v: string) => { const a = accounts.find((x) => x.code === v); return a ? `${a.code} - ${a.name}` : v; }}</SelectValue></SelectTrigger><SelectContent>{accounts.map((account) => <SelectItem key={account.code} value={account.code}>{account.code} - {account.name}</SelectItem>)}</SelectContent></Select></div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Tanda tangan PDF</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">

          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-foreground">Penanda tangan penawaran</h4>
            <p className="text-xs text-muted-foreground">Dipakai di PDF penawaran. PNG latar transparan paling rapi; tanda tangan & stempel boleh jadi satu gambar.</p>
            <div className="grid gap-2"><Label>Nama</Label><Input value={settings.quotationSignatoryName} onChange={(e) => update("quotationSignatoryName", e.target.value)} /></div>
            <div className="grid gap-2"><Label>Jabatan</Label><Input value={settings.quotationSignatoryTitle} onChange={(e) => update("quotationSignatoryTitle", e.target.value)} /></div>
            <KolomGambar label="Tanda tangan penawaran" nilai={settings.quotationSignatureImageUrl} onUbah={(url) => update("quotationSignatureImageUrl" as GambarKey, url)} />
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="font-semibold text-sm text-foreground">Tanda tangan tagihan & kwitansi</h4>
            <p className="text-xs text-muted-foreground">Dipakai di PDF tagihan dan kwitansi, atas nama penanda tangan tagihan ({settings.defaultSignatoryName}). Kosong = PDF tanpa tanda tangan.</p>
            <KolomGambar label="Tanda tangan" nilai={settings.signatureImageUrl} onUbah={(url) => update("signatureImageUrl" as GambarKey, url)} />
            <KolomGambar label="Stempel" nilai={settings.stampImageUrl} onUbah={(url) => update("stampImageUrl" as GambarKey, url)} />
          </div>

          <div className="pt-4 flex flex-col gap-2"><Button disabled={saving} onClick={save}>{saving ? "Menyimpan..." : "Simpan setelan"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
