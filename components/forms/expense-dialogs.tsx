"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { MoneyInput } from "@/components/forms/money-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";

type Expense = {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: string;
  projectId: number | null;
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

export function CreateExpenseDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("Operational");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("Approved");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2"><Plus className="size-4" /> Add Expense</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Expense</DialogTitle>
          <DialogDescription>Catat biaya baru dan jurnal akan dibuat otomatis.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Tanggal</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Kategori</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Deskripsi</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Nominal</Label><MoneyInput value={amount} onChange={setAmount} placeholder="1.500.000" /></div>
          <div className="grid gap-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value ?? "Approved")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select></div>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">Nominal expense: <span className="font-semibold">Rp {formatMoneyInput(amount)}</span></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button disabled={loading || !description || parseMoneyInput(amount) <= 0} onClick={async () => {
            try {
              setLoading(true);
              await send("/api/expenses", "POST", { date, category, description, amount, status });
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

export function ExpenseRowActions({ expense }: { expense: Expense }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(expense.date.slice(0, 10));
  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [status, setStatus] = useState(expense.status);

  const canSave = useMemo(() => description && parseMoneyInput(amount) > 0, [description, amount]);

  return (
    <div className="flex justify-end gap-2">
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
            <div className="grid gap-2"><Label>Kategori</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Deskripsi</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Nominal</Label><MoneyInput value={amount} onChange={setAmount} placeholder="1.500.000" /></div>
            <div className="grid gap-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value ?? "Approved")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={!canSave} onClick={async () => {
              await send(`/api/expenses/${expense.id}`, "PATCH", { date, category, description, amount, status });
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
