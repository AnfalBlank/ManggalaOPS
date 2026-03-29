"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CoaRow = { code: string; name: string; type: string; normalBalance: string };

export function CoaManager({ initial }: { initial: CoaRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);

  return (
    <Card className="mb-8">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Chart of Accounts</h2>
            <p className="text-sm text-muted-foreground">Inisialisasi dan kelola COA dasar untuk accounting.</p>
          </div>
          <Button onClick={async () => {
            const response = await fetch('/api/accounting/coa', { method: 'POST' });
            const payload = await response.json();
            if (!response.ok) { toast.error(payload.error ?? 'Gagal inisialisasi COA'); return; }
            setRows(payload.data.map((row: { code: string; name: string; type: string | null; normalBalance: string | null }) => ({ code: row.code, name: row.name, type: row.type ?? 'Asset', normalBalance: row.normalBalance ?? 'Debit' })));
            toast.success('COA default berhasil diinisialisasi');
            router.refresh();
          }}>Inisialisasi COA Default</Button>
        </div>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.code} className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-lg border p-3">
              <Input value={row.code} readOnly />
              <Input value={row.name} onChange={(e) => setRows(rows.map((item) => item.code === row.code ? { ...item, name: e.target.value } : item))} />
              <Select value={row.type} onValueChange={(value) => setRows(rows.map((item) => item.code === row.code ? { ...item, type: value ?? 'Asset' } : item))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Asset">Asset</SelectItem><SelectItem value="Liability">Liability</SelectItem><SelectItem value="Equity">Equity</SelectItem><SelectItem value="Revenue">Revenue</SelectItem><SelectItem value="Expense">Expense</SelectItem></SelectContent></Select>
              <div className="flex gap-2">
                <Select value={row.normalBalance} onValueChange={(value) => setRows(rows.map((item) => item.code === row.code ? { ...item, normalBalance: value ?? 'Debit' } : item))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Debit">Debit</SelectItem><SelectItem value="Credit">Credit</SelectItem></SelectContent></Select>
                <Button variant="outline" onClick={async () => {
                  const response = await fetch('/api/accounting/coa', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) });
                  const payload = await response.json();
                  if (!response.ok) { toast.error(payload.error ?? 'Gagal update akun'); return; }
                  setRows(payload.data.map((item: { code: string; name: string; type: string | null; normalBalance: string | null }) => ({ code: item.code, name: item.name, type: item.type ?? 'Asset', normalBalance: item.normalBalance ?? 'Debit' })));
                  toast.success(`Akun ${row.code} diperbarui`);
                  router.refresh();
                }}>Simpan</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
