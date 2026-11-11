"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { DetailDialog, formatCurrency, formatDateSafe } from "@/components/forms/entity-detail-dialogs";
import { RupiahInput } from "@/components/forms/rupiah-input";
import { UnggahNota } from "@/components/forms/unggah-nota";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tampilkanBerkas } from "@/lib/dokumen-pdf";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";
import { expenseCategoryOptions, labelKategori, LABEL_MODE_PPN } from "@/lib/expense-categories";
import { computeExpenseTax, normalizeExpenseTaxMode } from "@/lib/expense-tax";
import { labelStatus } from "@/lib/label-status";

type PaymentAccount = { code: string; name: string; balance: number };
type ProjectOption = { id: number; name: string; clientName?: string };
export type PoPilihan = { id: number; poNumber: string; clientName: string; projectId: number | null };
export type PoSupplierPilihan = { id: number; code: string; clientPoId: number; supplierName: string };
type Expense = {
  id: number;
  date: string | Date;
  category: string;
  description: string;
  amount: number;
  taxMode?: string | null;
  taxPercent?: number | null;
  taxAmount?: number | null;
  baseAmount?: number | null;
  status: string | null;
  projectId: number | null;
  paymentAccountCode?: string | null;
  clientPoId?: number | null;
  supplierPoId?: number | null;
  receiptUrl?: string | null;
};

class PerluKonfirmasi extends Error {}

async function send(url: string, method: string, body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 409 && payload.perluKonfirmasi) throw new PerluKonfirmasi(payload.error);
  if (!response.ok) throw new Error(payload.error ?? "Gagal menyimpan, coba lagi");
  return payload;
}

function labelAkun(accounts: PaymentAccount[], code: string) {
  const account = accounts.find((item) => item.code === code);
  return account ? `${account.code} - ${account.name}` : code;
}

function labelKategoriPilihan(value: string) {
  return value === "__custom" ? "Lainnya (tulis sendiri)..." : labelKategori(value);
}

const hariIni = () => new Date().toISOString().slice(0, 10);

type Isi = {
  date: string;
  category: string;
  customCategory: string;
  description: string;
  amount: string;
  taxMode: "none" | "exclude" | "include";
  taxPercent: string;
  status: string;
  paymentAccountCode: string;
  projectId: string;
  clientPoId: string;
  supplierPoId: string;
  receiptUrl: string;
};

function isiAwal(expense: Expense | null, paymentAccounts: PaymentAccount[], bawaan?: Partial<Isi>): Isi {
  if (!expense) {
    return {
      date: hariIni(),
      category: "Operational",
      customCategory: "",
      description: "",
      amount: "",
      taxMode: "none",
      taxPercent: "11",
      status: "Approved",
      paymentAccountCode: paymentAccounts[0]?.code ?? "1001",
      projectId: "none",
      clientPoId: "none",
      supplierPoId: "none",
      receiptUrl: "",
      ...bawaan,
    };
  }
  const kategoriBaku = expenseCategoryOptions.includes(expense.category as never);
  return {
    date: new Date(expense.date).toISOString().slice(0, 10),
    category: kategoriBaku ? expense.category : "__custom",
    customCategory: kategoriBaku ? "" : expense.category,
    description: expense.description,
    amount: String(expense.amount),
    taxMode: normalizeExpenseTaxMode(expense.taxMode),
    taxPercent: String(expense.taxPercent ?? 11),
    status: expense.status ?? "Approved",
    paymentAccountCode: expense.paymentAccountCode ?? paymentAccounts[0]?.code ?? "1001",
    projectId: expense.projectId ? String(expense.projectId) : "none",
    clientPoId: expense.clientPoId ? String(expense.clientPoId) : "none",
    supplierPoId: expense.supplierPoId ? String(expense.supplierPoId) : "none",
    receiptUrl: expense.receiptUrl ?? "",
  };
}

function kategoriAkhir(isi: Isi) {
  return isi.category === "__custom" ? isi.customCategory.trim() : isi.category;
}

function dataKirim(isi: Isi, konfirmasiDobel: boolean) {
  return {
    date: isi.date,
    category: kategoriAkhir(isi),
    description: isi.description,
    amount: isi.amount,
    taxMode: isi.taxMode,
    taxPercent: isi.taxPercent,
    status: isi.status,
    paymentAccountCode: isi.paymentAccountCode,
    projectId: isi.projectId === "none" ? null : isi.projectId,
    clientPoId: isi.clientPoId === "none" ? null : isi.clientPoId,
    supplierPoId: isi.supplierPoId === "none" ? null : isi.supplierPoId,
    receiptUrl: isi.receiptUrl || null,
    konfirmasiDobel,
  };
}

function bisaSimpan(isi: Isi) {
  const pakaiPo = isi.clientPoId !== "none";
  return Boolean(isi.description.trim()) && Boolean(kategoriAkhir(isi)) && parseMoneyInput(isi.amount) > 0 && Boolean(isi.paymentAccountCode) && (!pakaiPo || Boolean(isi.receiptUrl));
}

function FormPengeluaran({
  isi,
  ubah,
  paymentAccounts,
  projects,
  poKlien,
  poSupplier,
  kunciPo,
}: {
  isi: Isi;
  ubah: (patch: Partial<Isi>) => void;
  paymentAccounts: PaymentAccount[];
  projects: ProjectOption[];
  poKlien: PoPilihan[];
  poSupplier: PoSupplierPilihan[];
  kunciPo?: { poNumber: string; clientName: string; projectName: string | null };
}) {
  const computedTax = computeExpenseTax(parseMoneyInput(isi.amount), isi.taxMode, Number(isi.taxPercent) || 0);
  const saldo = paymentAccounts.find((account) => account.code === isi.paymentAccountCode)?.balance ?? 0;
  const kategoriTerpilih = expenseCategoryOptions.includes(isi.category as never) ? isi.category : "__custom";
  const poTerpilih = poKlien.find((po) => String(po.id) === isi.clientPoId);
  const proyekDariPo = Boolean(poTerpilih?.projectId);
  const labelProyek = (id: string) => (id === "none" ? "Tanpa proyek" : (projects.find((p) => String(p.id) === id)?.name ?? "Proyek"));
  const supplierPilihan = poSupplier.filter((s) => String(s.clientPoId) === isi.clientPoId);
  const labelSupplier = (id: string) => {
    if (id === "none") return "Tanpa PO supplier";
    const s = poSupplier.find((x) => String(x.id) === id);
    return s ? `${s.code} — ${s.supplierName}` : "PO supplier";
  };
  const pakaiPo = isi.clientPoId !== "none";

  return (
    <div className="grid gap-4">
      {kunciPo ? (
        <div className="rounded-lg border bg-slate-50 p-3 text-sm">
          <p>
            PO klien: <span className="font-semibold">{kunciPo.poNumber}</span> · {kunciPo.clientName}
          </p>
          <p className="mt-0.5 text-muted-foreground">Proyek: {kunciPo.projectName ?? "-"}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            <Label>PO klien (boleh kosong)</Label>
            <Select
              value={isi.clientPoId}
              onValueChange={(value) => {
                const v = value ?? "none";
                const po = poKlien.find((p) => String(p.id) === v);
                ubah({ clientPoId: v, supplierPoId: "none", ...(po?.projectId ? { projectId: String(po.projectId) } : {}) });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih PO klien">{(value: string) => (value === "none" ? "Tanpa PO" : (() => { const po = poKlien.find((p) => String(p.id) === value); return po ? `PO ${po.poNumber} — ${po.clientName}` : "PO klien"; })())}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa PO</SelectItem>
                {poKlien.map((po) => (
                  <SelectItem key={po.id} value={String(po.id)}>
                    PO {po.poNumber} — {po.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Proyek {proyekDariPo ? "(ikut PO)" : "(boleh kosong)"}</Label>
            <Select value={isi.projectId} onValueChange={(value) => ubah({ projectId: value ?? "none" })} disabled={proyekDariPo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih proyek">{(value: string) => labelProyek(value)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa proyek</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name}
                    {project.clientName ? ` — ${project.clientName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      {pakaiPo ? (
        <div className="grid gap-2">
          <Label>PO supplier (boleh kosong)</Label>
          <Select value={isi.supplierPoId} onValueChange={(value) => ubah({ supplierPoId: value ?? "none" })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih PO supplier">{(value: string) => labelSupplier(value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tanpa PO supplier</SelectItem>
              {supplierPilihan.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.code} — {s.supplierName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {supplierPilihan.length === 0 ? <p className="text-xs text-muted-foreground">PO ini belum punya PO supplier.</p> : null}
        </div>
      ) : null}
      <div className="grid gap-2"><Label>Tanggal</Label><Input type="date" value={isi.date} onChange={(e) => ubah({ date: e.target.value })} /></div>
      <div className="grid gap-2"><Label>Kategori</Label><Select value={kategoriTerpilih} onValueChange={(value) => ubah({ category: value ?? "Operational" })}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih kategori">{(value: string) => labelKategoriPilihan(value)}</SelectValue></SelectTrigger><SelectContent>{expenseCategoryOptions.map((item) => <SelectItem key={item} value={item}>{labelKategori(item)}</SelectItem>)}<SelectItem value="__custom">Lainnya (tulis sendiri)...</SelectItem></SelectContent></Select></div>
      {kategoriTerpilih === "__custom" ? <div className="grid gap-2"><Label>Kategori baru</Label><Input value={isi.customCategory} onChange={(e) => ubah({ customCategory: e.target.value })} placeholder="Contoh: Legal / Perizinan" /></div> : null}
      <div className="grid gap-2"><Label>Keterangan</Label><Input value={isi.description} onChange={(e) => ubah({ description: e.target.value })} placeholder={pakaiPo ? "Contoh: Beli kabel 50 m buat PO ini" : "Contoh: Bensin pengiriman ke klien"} /></div>
      <div className="grid gap-2"><Label>Nominal</Label><RupiahInput value={isi.amount} onChange={(v) => ubah({ amount: v })} placeholder="1500000" /></div>
      <div className="grid gap-2"><Label>PPN</Label><Select value={isi.taxMode} onValueChange={(value) => ubah({ taxMode: normalizeExpenseTaxMode(value) })}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih PPN">{(value: string) => LABEL_MODE_PPN[value] ?? value}</SelectValue></SelectTrigger><SelectContent><SelectItem value="none">Tanpa PPN</SelectItem><SelectItem value="exclude">Belum termasuk PPN (ditambah)</SelectItem><SelectItem value="include">Sudah termasuk PPN</SelectItem></SelectContent></Select></div>
      <div className="grid gap-2"><Label>Persen PPN (%)</Label><Input type="number" min="0" step="0.01" value={isi.taxPercent} onChange={(e) => ubah({ taxPercent: e.target.value })} disabled={isi.taxMode === "none"} /></div>
      <div className="grid gap-2"><Label>Dibayar dari akun</Label><Select value={isi.paymentAccountCode} onValueChange={(value) => ubah({ paymentAccountCode: value ?? "1001" })}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih akun">{(value: string) => labelAkun(paymentAccounts, value)}</SelectValue></SelectTrigger><SelectContent>{paymentAccounts.map((account) => <SelectItem key={account.code} value={account.code}>{account.code} - {account.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
        <div>DPP (sebelum PPN): <span className="font-semibold">Rp {formatMoneyInput(computedTax.baseAmount)}</span></div>
        <div>PPN masukan: <span className="font-semibold">Rp {formatMoneyInput(computedTax.taxAmount)}</span></div>
        <div>Total pengeluaran: <span className="font-semibold">Rp {formatMoneyInput(computedTax.totalAmount)}</span></div>
        <div>Saldo akun sekarang: <span className="font-semibold">{formatCurrency(saldo)}</span></div>
      </div>
      <div className="grid gap-2">
        <Label>
          Nota (foto / PDF){pakaiPo ? <span className="text-rose-600"> *</span> : " (boleh kosong)"}
        </Label>
        <UnggahNota value={isi.receiptUrl} onChange={(url) => ubah({ receiptUrl: url })} wajib={pakaiPo} />
      </div>
      <div className="grid gap-2"><Label>Status</Label><Select value={isi.status} onValueChange={(value) => ubah({ status: value ?? "Approved" })}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status">{(value: string) => labelStatus(value)}</SelectValue></SelectTrigger><SelectContent><SelectItem value="Approved">{labelStatus("Approved")}</SelectItem><SelectItem value="Pending">{labelStatus("Pending")}</SelectItem></SelectContent></Select></div>
    </div>
  );
}

// Tombol simpan + peringatan dobel ("Tetap simpan"). Tombol mati selama nyimpen biar gak keklik 2x.
function useSimpan(simpan: (konfirmasiDobel: boolean) => Promise<void>) {
  const [loading, setLoading] = useState(false);
  const [dobel, setDobel] = useState<string | null>(null);
  const jalan = async (konfirmasiDobel: boolean) => {
    if (loading) return;
    try {
      setLoading(true);
      await simpan(konfirmasiDobel);
      setDobel(null);
    } catch (error) {
      if (error instanceof PerluKonfirmasi) setDobel(error.message);
      else toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };
  return { loading, dobel, setDobel, jalan };
}

function PeringatanDobel({ pesan, loading, onLanjut }: { pesan: string; loading: boolean; onLanjut: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> {pesan}</p>
      <Button variant="outline" size="sm" className="self-start" disabled={loading} onClick={onLanjut}>Tetap simpan</Button>
    </div>
  );
}

type DialogProps = {
  paymentAccounts?: PaymentAccount[];
  projects?: ProjectOption[];
  poKlien?: PoPilihan[];
  poSupplier?: PoSupplierPilihan[];
};

export function CreateExpenseDialog({ paymentAccounts = [], projects = [], poKlien = [], poSupplier = [] }: DialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isi, setIsi] = useState<Isi>(() => isiAwal(null, paymentAccounts));
  const ubah = (patch: Partial<Isi>) => setIsi((lama) => ({ ...lama, ...patch }));
  const { loading, dobel, setDobel, jalan } = useSimpan(async (konfirmasiDobel) => {
    await send("/api/expenses", "POST", dataKirim(isi, konfirmasiDobel));
    toast.success("Pengeluaran dicatat");
    setOpen(false);
    setIsi(isiAwal(null, paymentAccounts));
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDobel(null); }}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2"><Plus className="size-4" /> Catat pengeluaran</Button>} />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catat pengeluaran</DialogTitle>
          <DialogDescription>Catat biaya baru, pilih dibayar dari akun mana, dan hubungkan ke PO atau proyek kalau ada.</DialogDescription>
        </DialogHeader>
        <FormPengeluaran isi={isi} ubah={(p) => { ubah(p); setDobel(null); }} paymentAccounts={paymentAccounts} projects={projects} poKlien={poKlien} poSupplier={poSupplier} />
        {dobel ? <PeringatanDobel pesan={dobel} loading={loading} onLanjut={() => jalan(true)} /> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button disabled={loading || !bisaSimpan(isi)} onClick={() => jalan(false)}>{loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dipakai di halaman detail PO klien: PO & proyek udah pasti, nota wajib.
export function CatatBelanjaDialog({
  po,
  poSupplier = [],
  paymentAccounts = [],
}: {
  po: { id: number; poNumber: string; clientName: string; projectId: number | null; projectName: string | null };
  poSupplier?: PoSupplierPilihan[];
  paymentAccounts?: PaymentAccount[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const bawaan: Partial<Isi> = { category: "Project", clientPoId: String(po.id), projectId: po.projectId ? String(po.projectId) : "none" };
  const [isi, setIsi] = useState<Isi>(() => isiAwal(null, paymentAccounts, bawaan));
  const ubah = (patch: Partial<Isi>) => setIsi((lama) => ({ ...lama, ...patch }));
  const { loading, dobel, setDobel, jalan } = useSimpan(async (konfirmasiDobel) => {
    await send("/api/expenses", "POST", dataKirim(isi, konfirmasiDobel));
    toast.success("Belanja dicatat");
    setOpen(false);
    setIsi(isiAwal(null, paymentAccounts, bawaan));
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDobel(null); }}>
      <DialogTrigger render={<Button className="gap-2"><ShoppingCart className="size-4" /> Catat belanja</Button>} />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catat belanja PO {po.poNumber}</DialogTitle>
          <DialogDescription>Biaya buat PO ini. Masuk ke pengeluaran & jurnal, dan dihitung di untung/rugi PO.</DialogDescription>
        </DialogHeader>
        <FormPengeluaran
          isi={isi}
          ubah={(p) => { ubah(p); setDobel(null); }}
          paymentAccounts={paymentAccounts}
          projects={[]}
          poKlien={[{ id: po.id, poNumber: po.poNumber, clientName: po.clientName, projectId: po.projectId }]}
          poSupplier={poSupplier}
          kunciPo={{ poNumber: po.poNumber, clientName: po.clientName, projectName: po.projectName }}
        />
        {dobel ? <PeringatanDobel pesan={dobel} loading={loading} onLanjut={() => jalan(true)} /> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button disabled={loading || !bisaSimpan(isi)} onClick={() => jalan(false)}>{loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan belanja"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LihatNota({ url, kode }: { url: string; kode: string }) {
  return (
    <button type="button" className="text-sm font-medium text-primary underline" onClick={() => tampilkanBerkas(url, `Nota-${kode}${url.slice(url.lastIndexOf("."))}`)}>
      Lihat nota
    </button>
  );
}

export function ExpenseRowActions({ expense, paymentAccounts = [], projects = [], poKlien = [], poSupplier = [] }: { expense: Expense } & DialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isi, setIsi] = useState<Isi>(() => isiAwal(expense, paymentAccounts));
  const ubah = (patch: Partial<Isi>) => setIsi((lama) => ({ ...lama, ...patch }));
  const kode = `EXP-${String(expense.id).padStart(4, "0")}`;
  const { loading, dobel, setDobel, jalan } = useSimpan(async (konfirmasiDobel) => {
    await send(`/api/expenses/${expense.id}`, "PATCH", dataKirim(isi, konfirmasiDobel));
    toast.success("Pengeluaran diperbarui");
    setOpen(false);
    router.refresh();
  });

  const selectedProject = projects.find((project) => String(project.id) === String(expense.projectId));
  const selectedAccount = paymentAccounts.find((account) => account.code === expense.paymentAccountCode);
  const poTerpilih = poKlien.find((po) => po.id === expense.clientPoId);
  const supTerpilih = poSupplier.find((s) => s.id === expense.supplierPoId);

  return (
    <div className="flex justify-end gap-2">
      <DetailDialog
        title={`Detail pengeluaran ${kode}`}
        description="Ringkasan lengkap data pengeluaran"
        rows={[
          { label: "Tanggal", value: formatDateSafe(String(expense.date)) },
          { label: "Kategori", value: labelKategori(expense.category) },
          { label: "Keterangan", value: expense.description },
          { label: "DPP", value: formatCurrency(expense.baseAmount ?? expense.amount) },
          { label: "PPN masukan", value: formatCurrency(expense.taxAmount ?? 0) },
          { label: "Total", value: formatCurrency(expense.amount) },
          { label: "Status", value: labelStatus(expense.status) },
          { label: "PO klien", value: poTerpilih ? `PO ${poTerpilih.poNumber} — ${poTerpilih.clientName}` : "-" },
          { label: "PO supplier", value: supTerpilih ? `${supTerpilih.code} — ${supTerpilih.supplierName}` : "-" },
          { label: "Proyek", value: selectedProject?.name ?? "-" },
          { label: "Dibayar dari akun", value: selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : (expense.paymentAccountCode ?? "-") },
          { label: "Nota", value: expense.receiptUrl ? <LihatNota url={expense.receiptUrl} kode={kode} /> : "Belum ada" },
        ]}
      />
      <Button variant="outline" size="sm" onClick={() => { setIsi(isiAwal(expense, paymentAccounts)); setDobel(null); setOpen(true); }}>Ubah</Button>
      <ConfirmDialog
        trigger={<Button variant="outline" size="sm" className="text-destructive">Hapus</Button>}
        title={`Hapus pengeluaran "${expense.description}"?`}
        description="Pengeluaran ini dan jurnal akuntansinya akan dihapus permanen."
        confirmText="Hapus"
        variant="destructive"
        onConfirm={async () => {
          await send(`/api/expenses/${expense.id}`, "DELETE");
          toast.success("Pengeluaran dihapus");
          router.refresh();
        }}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ubah pengeluaran</DialogTitle>
            <DialogDescription>Perubahan otomatis ikut ke jurnal akuntansi.</DialogDescription>
          </DialogHeader>
          <FormPengeluaran isi={isi} ubah={(p) => { ubah(p); setDobel(null); }} paymentAccounts={paymentAccounts} projects={projects} poKlien={poKlien} poSupplier={poSupplier} />
          {dobel ? <PeringatanDobel pesan={dobel} loading={loading} onLanjut={() => jalan(true)} /> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={!bisaSimpan(isi) || loading} onClick={() => jalan(false)}>{loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
