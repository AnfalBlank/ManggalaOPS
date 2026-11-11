"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DetailDialog, formatCurrency, formatDateSafe } from "@/components/forms/entity-detail-dialogs";
import { InvoiceDialog } from "@/components/forms/invoice-dialogs";
import { MoneyInput } from "@/components/forms/money-input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labelStatus, namaProyek } from "@/lib/label-status";
import type { InvoiceListItem, PaymentListItem } from "@/lib/types";

type ClientOption = { id: number; name: string };
type InvoiceOption = { id: number; code: string; clientId?: number; clientName?: string };
type PaymentAccountOption = { code: string; name: string };

async function requestJson(url: string, method: "PATCH" | "DELETE", body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "Gagal menyimpan, coba lagi");
  return payload;
}

export function InvoiceRowActions({ row, clients }: { row: InvoiceListItem; clients: ClientOption[] }) {
  const router = useRouter();

  return (
    <div className="flex justify-end gap-2 flex-wrap">
      <DetailDialog
        title={`Detail ${row.code}`}
        description="Ringkasan lengkap data tagihan"
        rows={[
          { label: "No. tagihan", value: row.code },
          { label: "Klien", value: row.clientName },
          { label: "Proyek", value: namaProyek(row.projectName) },
          { label: "Tanggal terbit", value: formatDateSafe(row.date) },
          { label: "Jatuh tempo", value: formatDateSafe(row.dueDate) },
          { label: "Cara bayar", value: row.paymentMethod === "Term" ? "Tempo" : (row.paymentMethod ?? "-") },
          { label: "Subtotal", value: formatCurrency(row.subtotal) },
          { label: "PPN", value: formatCurrency(row.tax) },
          { label: "Total", value: formatCurrency(row.total) },
          { label: "Sudah dibayar", value: formatCurrency(row.amountPaid) },
          { label: "Sisa", value: formatCurrency(row.outstandingAmount) },
          { label: "Status", value: labelStatus(row.status) },
        ]}
      />
      <InvoiceDialog clients={clients} invoice={row} />
      <ConfirmDialog
        trigger={<Button variant="outline" size="sm" className="text-destructive"><Trash2 className="size-4" /> Hapus</Button>}
        title={`Hapus tagihan ${row.code}?`}
        description="Tagihan dihapus permanen. Tagihan yang sudah ada pembayarannya gak bisa dihapus."
        confirmText="Hapus"
        variant="destructive"
        onConfirm={async () => {
          try {
            await requestJson(`/api/invoices/${row.id}`, "DELETE");
            toast.success("Tagihan dihapus");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Gagal menghapus tagihan");
          }
        }}
      />
    </div>
  );
}

export function PaymentRowActions({ row, clients, invoices, paymentAccounts = [] }: { row: PaymentListItem; clients: ClientOption[]; invoices: InvoiceOption[]; paymentAccounts?: PaymentAccountOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(String(row.clientId));
  const [invoiceId, setInvoiceId] = useState(String(row.invoiceId));
  const [amount, setAmount] = useState(String(row.amount));
  const [paymentMethod, setPaymentMethod] = useState(row.paymentMethod ?? "");
  const [paymentAccountCode, setPaymentAccountCode] = useState(row.paymentAccountCode ?? paymentAccounts[0]?.code ?? "1002");
  const [referenceCode, setReferenceCode] = useState(row.referenceCode ?? "");
  const [menyimpan, setMenyimpan] = useState(false);
  const filteredInvoices = invoices.filter((invoice) => !clientId || String(invoice.clientId ?? "") === clientId);

  return (
    <div className="flex justify-end gap-2 flex-wrap">
      <DetailDialog
        title={`Detail ${row.code}`}
        description="Ringkasan lengkap data pembayaran"
        rows={[
          { label: "No. kwitansi", value: row.code },
          { label: "Klien", value: row.clientName },
          { label: "Tagihan", value: row.invoiceCode },
          { label: "Tanggal", value: formatDateSafe(row.date) },
          { label: "Nominal", value: formatCurrency(row.amount) },
          { label: "Cara bayar", value: row.paymentMethod ?? "-" },
          { label: "Masuk ke akun", value: paymentAccounts.find((account) => account.code === row.paymentAccountCode)?.name ?? row.paymentAccountCode ?? "-" },
          { label: "No. referensi", value: row.referenceCode ?? "-" },
        ]}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm"><Pencil className="size-4" /> Ubah</Button>} />
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ubah pembayaran {row.code}</DialogTitle>
            <DialogDescription>Perbarui data pembayaran masuk.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2"><Label>Klien</Label><Select value={clientId} onValueChange={(value) => { setClientId(value ?? ""); setInvoiceId(""); }}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih klien">{clients.find((client) => String(client.id) === clientId)?.name}</SelectValue></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Tagihan</Label><Select value={invoiceId} onValueChange={(value) => setInvoiceId(value ?? "")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih tagihan">{filteredInvoices.find((invoice) => String(invoice.id) === invoiceId)?.code}</SelectValue></SelectTrigger><SelectContent>{filteredInvoices.map((invoice) => <SelectItem key={invoice.id} value={String(invoice.id)}>{invoice.code}{invoice.clientName ? ` — ${invoice.clientName}` : ""}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Nominal</Label><MoneyInput value={amount} onChange={setAmount} placeholder="10.000.000" /></div>
            <div className="grid gap-2"><Label>Masuk ke akun</Label><Select value={paymentAccountCode} onValueChange={(value) => setPaymentAccountCode(value ?? "1002")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih akun penerimaan">{(value: string) => { const akun = paymentAccounts.find((account) => account.code === value); return akun ? `${akun.code} - ${akun.name}` : value; }}</SelectValue></SelectTrigger><SelectContent>{paymentAccounts.map((account) => <SelectItem key={account.code} value={account.code}>{account.code} - {account.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Cara bayar</Label><Input value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} /></div>
            <div className="grid gap-2"><Label>No. referensi (opsional)</Label><Input value={referenceCode} onChange={(event) => setReferenceCode(event.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={menyimpan} onClick={async () => {
              if (menyimpan) return;
              setMenyimpan(true);
              try {
                await requestJson(`/api/payments/${row.id}`, "PATCH", { clientId, invoiceId, amount, paymentMethod, paymentAccountCode, referenceCode });
                toast.success("Pembayaran diperbarui");
                setOpen(false);
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan pembayaran");
              } finally {
                setMenyimpan(false);
              }
            }}>{menyimpan ? "Menyimpan…" : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        trigger={<Button variant="outline" size="sm" className="text-destructive"><Trash2 className="size-4" /> Hapus</Button>}
        title={`Hapus pembayaran ${row.code}?`}
        description="Pembayaran dihapus permanen dan jurnal akuntansinya ikut dibatalkan."
        confirmText="Hapus"
        variant="destructive"
        onConfirm={async () => {
          try {
            await requestJson(`/api/payments/${row.id}`, "DELETE");
            toast.success("Pembayaran dihapus");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Gagal menghapus pembayaran");
          }
        }}
      />
    </div>
  );
}
