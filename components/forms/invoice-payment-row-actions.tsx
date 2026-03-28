"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DetailDialog, formatCurrency, formatDateSafe } from "@/components/forms/entity-detail-dialogs";
import { InvoiceDialog } from "@/components/forms/invoice-dialogs";
import { MoneyInput } from "@/components/forms/money-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InvoiceListItem, PaymentListItem } from "@/lib/types";

type ClientOption = { id: number; name: string };
type InvoiceOption = { id: number; code: string };

async function requestJson(url: string, method: "PATCH" | "DELETE", body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload;
}

export function InvoiceRowActions({ row, clients }: { row: InvoiceListItem; clients: ClientOption[] }) {
  const router = useRouter();

  return (
    <div className="flex justify-end gap-2 flex-wrap">
      <DetailDialog
        title={`Detail ${row.code}`}
        description="Ringkasan lengkap data invoice"
        rows={[
          { label: "Invoice ID", value: row.code },
          { label: "Client", value: row.clientName },
          { label: "Project", value: row.projectName ?? "-" },
          { label: "Issued", value: formatDateSafe(row.date) },
          { label: "Due Date", value: formatDateSafe(row.dueDate) },
          { label: "Payment Method", value: row.paymentMethod ?? "-" },
          { label: "Subtotal", value: formatCurrency(row.subtotal) },
          { label: "PPN", value: formatCurrency(row.tax) },
          { label: "Total", value: formatCurrency(row.total) },
          { label: "Paid", value: formatCurrency(row.amountPaid) },
          { label: "Outstanding", value: formatCurrency(row.outstandingAmount) },
          { label: "Status", value: row.status },
        ]}
      />
      <InvoiceDialog clients={clients} invoice={row} />
      <Button variant="outline" size="sm" className="text-destructive" onClick={async () => {
        if (!confirm(`Hapus invoice ${row.code}?`)) return;
        try {
          await requestJson(`/api/invoices/${row.id}`, "DELETE");
          toast.success("Invoice dihapus");
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Gagal hapus invoice");
        }
      }}><Trash2 className="size-4" /> Delete</Button>
    </div>
  );
}

export function PaymentRowActions({ row, clients, invoices }: { row: PaymentListItem; clients: ClientOption[]; invoices: InvoiceOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(String(row.clientId));
  const [invoiceId, setInvoiceId] = useState(String(row.invoiceId));
  const [amount, setAmount] = useState(String(row.amount));
  const [paymentMethod, setPaymentMethod] = useState(row.paymentMethod ?? "");
  const [referenceCode, setReferenceCode] = useState(row.referenceCode ?? "");

  return (
    <div className="flex justify-end gap-2 flex-wrap">
      <DetailDialog
        title={`Detail ${row.code}`}
        description="Ringkasan lengkap data payment"
        rows={[
          { label: "Payment ID", value: row.code },
          { label: "Client", value: row.clientName },
          { label: "Invoice", value: row.invoiceCode },
          { label: "Date", value: formatDateSafe(row.date) },
          { label: "Amount", value: formatCurrency(row.amount) },
          { label: "Method", value: row.paymentMethod ?? "-" },
          { label: "Reference", value: row.referenceCode ?? "-" },
        ]}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm"><Pencil className="size-4" /> Edit</Button>} />
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Perbarui data pembayaran masuk.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2"><Label>Client</Label><Select value={clientId} onValueChange={(value) => setClientId(value ?? "")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Invoice</Label><Select value={invoiceId} onValueChange={(value) => setInvoiceId(value ?? "")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{invoices.map((invoice) => <SelectItem key={invoice.id} value={String(invoice.id)}>{invoice.code}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Amount</Label><MoneyInput value={amount} onChange={setAmount} placeholder="10.000.000" /></div>
            <div className="grid gap-2"><Label>Payment Method</Label><Input value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} /></div>
            <div className="grid gap-2"><Label>Reference Code</Label><Input value={referenceCode} onChange={(event) => setReferenceCode(event.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={async () => {
              try {
                await requestJson(`/api/payments/${row.id}`, "PATCH", { clientId, invoiceId, amount, paymentMethod, referenceCode });
                toast.success("Payment diupdate");
                setOpen(false);
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal update payment");
              }
            }}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button variant="outline" size="sm" className="text-destructive" onClick={async () => {
        if (!confirm(`Hapus payment ${row.code}?`)) return;
        try {
          await requestJson(`/api/payments/${row.id}`, "DELETE");
          toast.success("Payment dihapus");
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Gagal hapus payment");
        }
      }}><Trash2 className="size-4" /> Delete</Button>
    </div>
  );
}
