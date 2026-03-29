"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { RupiahInput } from "@/components/forms/rupiah-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { parseMoneyInput } from "@/lib/money";

export function OpeningBalancePanel({ initial, mapping }: { initial?: { cashOnHand?: number | null; bankMandiri?: number | null; bankBca?: number | null; receivables?: number | null; fixedAssets?: number | null; liabilities?: number | null; equity?: number | null } | null; mapping: { cash: string; bankMandiri: string; bankBca: string; receivable: string; fixedAsset: string; liability: string; equity: string } }) {
  const [hidden, setHidden] = useState(Boolean(initial));
  const [cashOnHand, setCashOnHand] = useState(String(initial?.cashOnHand ?? 0));
  const [bankMandiri, setBankMandiri] = useState(String(initial?.bankMandiri ?? 0));
  const [bankBca, setBankBca] = useState(String(initial?.bankBca ?? 0));
  const [receivables, setReceivables] = useState(String(initial?.receivables ?? 0));
  const [fixedAssets, setFixedAssets] = useState(String(initial?.fixedAssets ?? 0));
  const [liabilities, setLiabilities] = useState(String(initial?.liabilities ?? 0));
  const [equity, setEquity] = useState(String(initial?.equity ?? 0));
  const [saving, setSaving] = useState(false);

  const totalDebit = useMemo(() => parseMoneyInput(cashOnHand) + parseMoneyInput(bankMandiri) + parseMoneyInput(bankBca) + parseMoneyInput(receivables) + parseMoneyInput(fixedAssets), [cashOnHand, bankMandiri, bankBca, receivables, fixedAssets]);
  const totalCredit = useMemo(() => parseMoneyInput(liabilities) + parseMoneyInput(equity), [liabilities, equity]);
  const balanced = totalDebit === totalCredit;

  if (hidden) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Saldo Awal Sudah Diset</h2>
            <p className="text-sm text-muted-foreground mt-1">Opening balance sudah tersimpan. Klik buka lagi kalau mau revisi.</p>
          </div>
          <Button variant="outline" onClick={() => setHidden(false)}>Buka Lagi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Setup Saldo Awal</h2>
          <p className="text-sm text-muted-foreground mt-1">Tetapkan opening balance berdasarkan account mapping settings.</p>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <div>Kas → {mapping.cash}</div>
            <div>Bank Mandiri → {mapping.bankMandiri}</div>
            <div>Bank BCA → {mapping.bankBca}</div>
            <div>Piutang → {mapping.receivable}</div>
            <div>Aset Tetap → {mapping.fixedAsset}</div>
            <div>Kewajiban → {mapping.liability}</div>
            <div>Ekuitas → {mapping.equity}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="grid gap-2"><Label>Saldo Kas</Label><RupiahInput value={cashOnHand} onChange={setCashOnHand} placeholder="0" /></div>
          <div className="grid gap-2"><Label>Saldo Bank Mandiri</Label><RupiahInput value={bankMandiri} onChange={setBankMandiri} placeholder="0" /></div>
          <div className="grid gap-2"><Label>Saldo Bank BCA</Label><RupiahInput value={bankBca} onChange={setBankBca} placeholder="0" /></div>
          <div className="grid gap-2"><Label>Saldo Piutang</Label><RupiahInput value={receivables} onChange={setReceivables} placeholder="0" /></div>
          <div className="grid gap-2"><Label>Saldo Aset Tetap</Label><RupiahInput value={fixedAssets} onChange={setFixedAssets} placeholder="0" /></div>
          <div className="grid gap-2"><Label>Saldo Kewajiban / Hutang</Label><RupiahInput value={liabilities} onChange={setLiabilities} placeholder="0" /></div>
          <div className="grid gap-2"><Label>Modal / Equity Awal</Label><RupiahInput value={equity} onChange={setEquity} placeholder="0" /></div>
        </div>
        <div className={`rounded-xl border p-4 text-sm ${balanced ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <div className="font-semibold mb-2">Ringkasan Jurnal Pembuka</div>
          <div className="flex flex-col gap-1 text-muted-foreground">
            <div>Total Debit: <span className="font-semibold text-foreground">{formatCurrency(totalDebit)}</span></div>
            <div>Total Kredit: <span className="font-semibold text-foreground">{formatCurrency(totalCredit)}</span></div>
            <div>Status: <span className={`font-semibold ${balanced ? "text-emerald-700" : "text-amber-700"}`}>{balanced ? "Balance" : "Belum balance"}</span></div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button disabled={saving || !balanced} onClick={async () => {
            try {
              setSaving(true);
              const response = await fetch('/api/accounting/opening-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cashOnHand, bankMandiri, bankBca, receivables, fixedAssets, liabilities, equity }),
              });
              const payload = await response.json();
              if (!response.ok) {
                toast.error(payload.error ?? 'Gagal simpan saldo awal');
                return;
              }
              toast.success('Saldo awal berhasil disimpan');
              setHidden(true);
              window.location.reload();
            } finally {
              setSaving(false);
            }
          }}>{saving ? 'Menyimpan...' : 'Simpan Saldo Awal'}</Button>
          <Button variant="outline" onClick={() => setHidden(true)}>Tutup</Button>
        </div>
      </CardContent>
    </Card>
  );
}
