"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { DetailDialog, formatCurrency, formatDateSafe } from "@/components/forms/entity-detail-dialogs";
import { RupiahInput } from "@/components/forms/rupiah-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";
import { expenseCategoryOptions } from "@/lib/expense-categories";
import { computeExpenseTax, normalizeExpenseTaxMode } from "@/lib/expense-tax";

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
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload;
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

  const selectedAccount = paymentAccounts.find((account) => account.code === paymentAccountCode);
  const selectedProjectLabel = projectId === "none" ? "Tanpa project" : projects.find((project) => String(project.id) === projectId)?.name;
  const computedTax = useMemo(() => computeExpenseTax(parseMoneyInput(amount), taxMode, Number(taxPercent) || 0), [amount, taxMode, taxPercent]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2"><Plus className="size-4" /> Add Expense</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Expense</DialogTitle>
          <DialogDescription>Catat biaya baru, pilih sumber pembayaran, dan relasikan ke project bila perlu.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Tanggal</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Kategori</Label><Select value={category} onValueChange={(value) => setCategory(value ?? "Operational")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih opsi" /></SelectTrigger><SelectContent>{expenseCategoryOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}<SelectItem value="__custom">Lainnya...</SelectItem></SelectContent></Select></div>
          {category === "__custom" ? <div className="grid gap-2"><Label>Kategori Baru</Label><Input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Contoh: Legal / Perizinan" /></div> : null}
          <div className="grid gap-2"><Label>Project (opsional)</Label><Select value={projectId} onValueChange={(value) => setProjectId(value ?? "none")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih project">{selectedProjectLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="none">Tanpa project</SelectItem>{projects.map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.name}{project.clientName ? ` — ${project.clientName}` : ""}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>Deskripsi</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Nominal</Label><RupiahInput value={amount} onChange={setAmount} placeholder="1500000" /></div>
          <div className="grid gap-2"><Label>Mode PPN</Label><Select value={taxMode} onValueChange={(value) => setTaxMode(normalizeExpenseTaxMode(value))}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih mode PPN" /></SelectTrigger><SelectContent><SelectItem value="none">Tanpa PPN</SelectItem><SelectItem value="exclude">Exclude 11%</SelectItem><SelectItem value="include">Include 11%</SelectItem></SelectContent></Select></div>
          <div className="grid gap-2"><Label>Persentase PPN (%)</Label><Input type="number" min="0" step="0.01" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} disabled={taxMode === "none"} /></div>
          <div className="grid gap-2"><Label>Dibayar dari akun</Label><Select value={paymentAccountCode} onValueChange={(value) => setPaymentAccountCode(value ?? "1001")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih opsi" /></SelectTrigger><SelectContent>{paymentAccounts.map((account) => <SelectItem key={account.code} value={account.code}>{account.code} - {account.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
            <div>DPP: <span className="font-semibold">Rp {formatMoneyInput(computedTax.baseAmount)}</span></div>
            <div>PPN Masukan: <span className="font-semibold">Rp {formatMoneyInput(computedTax.taxAmount)}</span></div>
            <div>Total expense: <span className="font-semibold">Rp {formatMoneyInput(computedTax.totalAmount)}</span></div>
            <div>Saldo tersedia: <span className="font-semibold">{formatCurrency(selectedAccount?.balance ?? 0)}</span></div>
          </div>
          <div className="grid gap-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value ?? "Approved")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih opsi" /></SelectTrigger><SelectContent><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button disabled={loading || !description || parseMoneyInput(amount) <= 0 || !paymentAccountCode} onClick={async () => {
            try {
              setLoading(true);
              await send("/api/expenses", "POST", { date, category: category === "__custom" ? customCategory : category, description, amount, taxMode, taxPercent, status, paymentAccountCode, projectId: projectId === "none" ? null : projectId });
              toast.success("Expense ditambahkan");
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal tambah expense");
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
  const [date, setDate] = useState(new Date(expense.date).toISOString().slice(0, 10));
  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [taxMode, setTaxMode] = useState<"none" | "exclude" | "include">(normalizeExpenseTaxMode(expense.taxMode));
  const [taxPercent, setTaxPercent] = useState(String(expense.taxPercent ?? 11));
  const [status, setStatus] = useState(expense.status);
  const [paymentAccountCode, setPaymentAccountCode] = useState(expense.paymentAccountCode ?? paymentAccounts[0]?.code ?? "1001");
  const [projectId, setProjectId] = useState(expense.projectId ? String(expense.projectId) : "none");

  const canSave = useMemo(() => description && parseMoneyInput(amount) > 0, [description, amount]);
  const selectedProject = projects.find((project) => String(project.id) === String(expense.projectId));
  const selectedProjectLabel = projectId === "none" ? "Tanpa project" : projects.find((project) => String(project.id) === projectId)?.name;
  const selectedAccount = paymentAccounts.find((account) => account.code === (expense.paymentAccountCode ?? paymentAccountCode));
  const computedTax = useMemo(() => computeExpenseTax(parseMoneyInput(amount), taxMode, Number(taxPercent) || 0), [amount, taxMode, taxPercent]);

  return (
    <div className="flex justify-end gap-2">
      <DetailDialog
        title={`Detail Expense #${expense.id}`}
        description="Ringkasan lengkap data expense"
        rows={[
          { label: "Date", value: formatDateSafe(String(expense.date)) },
          { label: "Category", value: expense.category },
          { label: "Description", value: expense.description },
          { label: "DPP", value: formatCurrency(expense.baseAmount ?? expense.amount) },
          { label: "PPN Masukan", value: formatCurrency(expense.taxAmount ?? 0) },
          { label: "Total Amount", value: formatCurrency(expense.amount) },
          { label: "Status", value: expense.status ?? "-" },
          { label: "Project", value: selectedProject?.name ?? "-" },
          { label: "Payment Account", value: selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : (expense.paymentAccountCode ?? "-") },
        ]}
      />
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Edit</Button>
      <Button variant="outline" size="sm" className="text-destructive" onClick={async () => {
        if (!confirm(`Hapus expense ${expense.description}?`)) return;
        await send(`/api/expenses/${expense.id}`, "DELETE");
        toast.success("Expense dihapus");
        router.refresh();
      }}>Delete</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Perubahan expense akan sync ke jurnal.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2"><Label>Tanggal</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Kategori</Label><Select value={expenseCategoryOptions.includes(category as never) ? category : "__custom"} onValueChange={(value) => setCategory(value ?? "Operational")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih opsi" /></SelectTrigger><SelectContent>{expenseCategoryOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}<SelectItem value="__custom">Lainnya...</SelectItem></SelectContent></Select></div>
            {(!expenseCategoryOptions.includes(category as never) || category === "__custom") ? <div className="grid gap-2"><Label>Kategori Baru</Label><Input value={category === "__custom" ? "" : category} onChange={(e) => setCategory(e.target.value)} placeholder="Contoh: Legal / Perizinan" /></div> : null}
            <div className="grid gap-2"><Label>Project (opsional)</Label><Select value={projectId} onValueChange={(value) => setProjectId(value ?? "none")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih project">{selectedProjectLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="none">Tanpa project</SelectItem>{projects.map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.name}{project.clientName ? ` — ${project.clientName}` : ""}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Deskripsi</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Nominal</Label><RupiahInput value={amount} onChange={setAmount} placeholder="1500000" /></div>
            <div className="grid gap-2"><Label>Mode PPN</Label><Select value={taxMode} onValueChange={(value) => setTaxMode(normalizeExpenseTaxMode(value))}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih mode PPN" /></SelectTrigger><SelectContent><SelectItem value="none">Tanpa PPN</SelectItem><SelectItem value="exclude">Exclude 11%</SelectItem><SelectItem value="include">Include 11%</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Persentase PPN (%)</Label><Input type="number" min="0" step="0.01" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} disabled={taxMode === "none"} /></div>
            <div className="grid gap-2"><Label>Dibayar dari akun</Label><Select value={paymentAccountCode} onValueChange={(value) => setPaymentAccountCode(value ?? "1001")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih opsi" /></SelectTrigger><SelectContent>{paymentAccounts.map((account) => <SelectItem key={account.code} value={account.code}>{account.code} - {account.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <div>DPP: <span className="font-semibold">Rp {formatMoneyInput(computedTax.baseAmount)}</span></div>
              <div>PPN Masukan: <span className="font-semibold">Rp {formatMoneyInput(computedTax.taxAmount)}</span></div>
              <div>Total expense: <span className="font-semibold">Rp {formatMoneyInput(computedTax.totalAmount)}</span></div>
              <div>Saldo tersedia: <span className="font-semibold">{formatCurrency((paymentAccounts.find((account) => account.code === paymentAccountCode)?.balance) ?? 0)}</span></div>
            </div>
            <div className="grid gap-2"><Label>Status</Label><Select value={status ?? "Approved"} onValueChange={(value) => setStatus(value ?? "Approved")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih opsi" /></SelectTrigger><SelectContent><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={!canSave} onClick={async () => {
              await send(`/api/expenses/${expense.id}`, "PATCH", { date, category: category === "__custom" ? "Other" : category, description, amount, taxMode, taxPercent, status, paymentAccountCode, projectId: projectId === "none" ? null : projectId });
              toast.success("Expense diupdate");
              setOpen(false);
              router.refresh();
            }}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
