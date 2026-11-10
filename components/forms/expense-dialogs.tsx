"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { DetailDialog, formatCurrency, formatDateSafe } from "@/components/forms/entity-detail-dialogs";
import { RupiahInput } from "@/components/forms/rupiah-input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";
import { expenseCategoryOptions, labelKategori, LABEL_MODE_PPN } from "@/lib/expense-categories";
import { computeExpenseTax, normalizeExpenseTaxMode } from "@/lib/expense-tax";
import { labelStatus } from "@/lib/label-status";

type PaymentAccount = { code: string; name: string; balance: number };
type ProjectOption = { id: number; name: string; clientName?: string };
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
};

async function send(url: string, method: string, body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
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

function FormPengeluaran({
  date, setDate, category, setCategory, customCategory, setCustomCategory, projectId, setProjectId, description, setDescription,
  amount, setAmount, taxMode, setTaxMode, taxPercent, setTaxPercent, paymentAccountCode, setPaymentAccountCode, status, setStatus,
  paymentAccounts, projects,
}: {
  date: string; setDate: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  customCategory: string; setCustomCategory: (v: string) => void;
  projectId: string; setProjectId: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  amount: string; setAmount: (v: string) => void;
  taxMode: "none" | "exclude" | "include"; setTaxMode: (v: "none" | "exclude" | "include") => void;
  taxPercent: string; setTaxPercent: (v: string) => void;
  paymentAccountCode: string; setPaymentAccountCode: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  paymentAccounts: PaymentAccount[]; projects: ProjectOption[];
}) {
  const selectedProjectLabel = projectId === "none" ? "Tanpa proyek" : projects.find((project) => String(project.id) === projectId)?.name;
  const computedTax = computeExpenseTax(parseMoneyInput(amount), taxMode, Number(taxPercent) || 0);
  const saldo = paymentAccounts.find((account) => account.code === paymentAccountCode)?.balance ?? 0;
  const kategoriTerpilih = expenseCategoryOptions.includes(category as never) ? category : "__custom";

  return (
    <div className="grid gap-4">
      <div className="grid gap-2"><Label>Tanggal</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div className="grid gap-2"><Label>Kategori</Label><Select value={kategoriTerpilih} onValueChange={(value) => setCategory(value ?? "Operational")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih kategori">{(value: string) => labelKategoriPilihan(value)}</SelectValue></SelectTrigger><SelectContent>{expenseCategoryOptions.map((item) => <SelectItem key={item} value={item}>{labelKategori(item)}</SelectItem>)}<SelectItem value="__custom">Lainnya (tulis sendiri)...</SelectItem></SelectContent></Select></div>
      {kategoriTerpilih === "__custom" ? <div className="grid gap-2"><Label>Kategori baru</Label><Input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Contoh: Legal / Perizinan" /></div> : null}
      <div className="grid gap-2"><Label>Proyek (boleh kosong)</Label><Select value={projectId} onValueChange={(value) => setProjectId(value ?? "none")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih proyek">{selectedProjectLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="none">Tanpa proyek</SelectItem>{projects.map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.name}{project.clientName ? ` — ${project.clientName}` : ""}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-2"><Label>Keterangan</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contoh: Bensin pengiriman ke klien" /></div>
      <div className="grid gap-2"><Label>Nominal</Label><RupiahInput value={amount} onChange={setAmount} placeholder="1500000" /></div>
      <div className="grid gap-2"><Label>PPN</Label><Select value={taxMode} onValueChange={(value) => setTaxMode(normalizeExpenseTaxMode(value))}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih PPN">{(value: string) => LABEL_MODE_PPN[value] ?? value}</SelectValue></SelectTrigger><SelectContent><SelectItem value="none">Tanpa PPN</SelectItem><SelectItem value="exclude">Belum termasuk PPN (ditambah)</SelectItem><SelectItem value="include">Sudah termasuk PPN</SelectItem></SelectContent></Select></div>
      <div className="grid gap-2"><Label>Persen PPN (%)</Label><Input type="number" min="0" step="0.01" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} disabled={taxMode === "none"} /></div>
      <div className="grid gap-2"><Label>Dibayar dari akun</Label><Select value={paymentAccountCode} onValueChange={(value) => setPaymentAccountCode(value ?? "1001")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih akun">{(value: string) => labelAkun(paymentAccounts, value)}</SelectValue></SelectTrigger><SelectContent>{paymentAccounts.map((account) => <SelectItem key={account.code} value={account.code}>{account.code} - {account.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
        <div>DPP (sebelum PPN): <span className="font-semibold">Rp {formatMoneyInput(computedTax.baseAmount)}</span></div>
        <div>PPN masukan: <span className="font-semibold">Rp {formatMoneyInput(computedTax.taxAmount)}</span></div>
        <div>Total pengeluaran: <span className="font-semibold">Rp {formatMoneyInput(computedTax.totalAmount)}</span></div>
        <div>Saldo akun sekarang: <span className="font-semibold">{formatCurrency(saldo)}</span></div>
      </div>
      <div className="grid gap-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value ?? "Approved")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status">{(value: string) => labelStatus(value)}</SelectValue></SelectTrigger><SelectContent><SelectItem value="Approved">{labelStatus("Approved")}</SelectItem><SelectItem value="Pending">{labelStatus("Pending")}</SelectItem></SelectContent></Select></div>
    </div>
  );
}

export function CreateExpenseDialog({ paymentAccounts = [], projects = [] }: { paymentAccounts?: PaymentAccount[]; projects?: ProjectOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("Operational");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [taxMode, setTaxMode] = useState<"none" | "exclude" | "include">("none");
  const [taxPercent, setTaxPercent] = useState("11");
  const [status, setStatus] = useState("Approved");
  const [paymentAccountCode, setPaymentAccountCode] = useState(paymentAccounts[0]?.code ?? "1001");
  const [projectId, setProjectId] = useState("none");
  const kategoriAkhir = category === "__custom" ? customCategory.trim() : category;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2"><Plus className="size-4" /> Catat pengeluaran</Button>} />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catat pengeluaran</DialogTitle>
          <DialogDescription>Catat biaya baru, pilih dibayar dari akun mana, dan hubungkan ke proyek kalau ada.</DialogDescription>
        </DialogHeader>
        <FormPengeluaran
          {...{ date, setDate, category, setCategory, customCategory, setCustomCategory, projectId, setProjectId, description, setDescription, amount, setAmount, taxMode, setTaxMode, taxPercent, setTaxPercent, paymentAccountCode, setPaymentAccountCode, status, setStatus, paymentAccounts, projects }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button disabled={loading || !description || !kategoriAkhir || parseMoneyInput(amount) <= 0 || !paymentAccountCode} onClick={async () => {
            try {
              setLoading(true);
              await send("/api/expenses", "POST", { date, category: kategoriAkhir, description, amount, taxMode, taxPercent, status, paymentAccountCode, projectId: projectId === "none" ? null : projectId });
              toast.success("Pengeluaran dicatat");
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal mencatat pengeluaran");
            } finally {
              setLoading(false);
            }
          }}>{loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExpenseRowActions({ expense, paymentAccounts = [], projects = [] }: { expense: Expense; paymentAccounts?: PaymentAccount[]; projects?: ProjectOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const kategoriBaku = expenseCategoryOptions.includes(expense.category as never);
  const [date, setDate] = useState(new Date(expense.date).toISOString().slice(0, 10));
  const [category, setCategory] = useState(kategoriBaku ? expense.category : "__custom");
  const [customCategory, setCustomCategory] = useState(kategoriBaku ? "" : expense.category);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [taxMode, setTaxMode] = useState<"none" | "exclude" | "include">(normalizeExpenseTaxMode(expense.taxMode));
  const [taxPercent, setTaxPercent] = useState(String(expense.taxPercent ?? 11));
  const [status, setStatus] = useState(expense.status ?? "Approved");
  const [paymentAccountCode, setPaymentAccountCode] = useState(expense.paymentAccountCode ?? paymentAccounts[0]?.code ?? "1001");
  const [projectId, setProjectId] = useState(expense.projectId ? String(expense.projectId) : "none");
  const kategoriAkhir = category === "__custom" ? customCategory.trim() : category;

  const canSave = useMemo(() => Boolean(description) && Boolean(kategoriAkhir) && parseMoneyInput(amount) > 0, [description, kategoriAkhir, amount]);
  const selectedProject = projects.find((project) => String(project.id) === String(expense.projectId));
  const selectedAccount = paymentAccounts.find((account) => account.code === expense.paymentAccountCode);

  return (
    <div className="flex justify-end gap-2">
      <DetailDialog
        title={`Detail pengeluaran EXP-${String(expense.id).padStart(4, "0")}`}
        description="Ringkasan lengkap data pengeluaran"
        rows={[
          { label: "Tanggal", value: formatDateSafe(String(expense.date)) },
          { label: "Kategori", value: labelKategori(expense.category) },
          { label: "Keterangan", value: expense.description },
          { label: "DPP", value: formatCurrency(expense.baseAmount ?? expense.amount) },
          { label: "PPN masukan", value: formatCurrency(expense.taxAmount ?? 0) },
          { label: "Total", value: formatCurrency(expense.amount) },
          { label: "Status", value: labelStatus(expense.status) },
          { label: "Proyek", value: selectedProject?.name ?? "-" },
          { label: "Dibayar dari akun", value: selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : (expense.paymentAccountCode ?? "-") },
        ]}
      />
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Ubah</Button>
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
          <FormPengeluaran
            {...{ date, setDate, category, setCategory, customCategory, setCustomCategory, projectId, setProjectId, description, setDescription, amount, setAmount, taxMode, setTaxMode, taxPercent, setTaxPercent, paymentAccountCode, setPaymentAccountCode, status, setStatus, paymentAccounts, projects }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={!canSave || loading} onClick={async () => {
              try {
                setLoading(true);
                await send(`/api/expenses/${expense.id}`, "PATCH", { date, category: kategoriAkhir, description, amount, taxMode, taxPercent, status, paymentAccountCode, projectId: projectId === "none" ? null : projectId });
                toast.success("Pengeluaran diperbarui");
                setOpen(false);
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan perubahan");
              } finally {
                setLoading(false);
              }
            }}>{loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
