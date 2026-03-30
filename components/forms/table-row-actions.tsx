"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { MoneyInput } from "@/components/forms/money-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";

type ClientOption = {
  id: number;
  name: string;
};

type InvoiceOption = {
  id: number;
  code: string;
  clientName?: string;
};

type LeadRow = {
  id: number;
  clientId: number;
  serviceName: string;
  estimatedValue: number;
  status: string;
};

type InvoiceRow = {
  id: number;
  clientId: number;
  subtotal: number;
  tax: number;
  total: number;
  dueDate: string | null;
};

type PaymentRow = {
  id: number;
  clientId: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string | null;
  referenceCode: string | null;
};

async function requestJson(url: string, method: "PATCH" | "DELETE", body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    headers: body
      ? {
          "Content-Type": "application/json",
        }
      : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

export function LeadRowActions({ row, clients }: { row: LeadRow; clients: ClientOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(String(row.clientId));
  const [serviceName, setServiceName] = useState(row.serviceName);
  const [estimatedValue, setEstimatedValue] = useState(String(row.estimatedValue));
  const [status, setStatus] = useState(row.status);
  const selectedClientName = clients.find((client) => String(client.id) === clientId)?.name;

  const handleDelete = async () => {
    if (!confirm(`Hapus lead ${row.serviceName}?`)) return;
    try {
      await requestJson(`/api/leads/${row.id}`, "DELETE");
      toast.success("Lead dihapus");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal hapus lead");
    }
  };

  const handleSave = async () => {
    try {
      await requestJson(`/api/leads/${row.id}`, "PATCH", {
        clientId,
        serviceName,
        estimatedValue,
        status,
      });
      toast.success("Lead diupdate");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal update lead");
    }
  };

  return (
    <RowActionsMenu
      editDialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<DropdownMenuItem onClick={(event) => event.preventDefault()}><Pencil className="size-4" /> Edit</DropdownMenuItem>} />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>Perbarui data lead yang sudah ada.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={(value) => setClientId(value ?? "") }>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Pilih client">{selectedClientName}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Service Need</Label>
                <Input value={serviceName} onChange={(event) => setServiceName(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Estimated Value</Label>
                <MoneyInput value={estimatedValue} onChange={setEstimatedValue} placeholder="111.000.000" />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value ?? "New") }>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Pilih data" /></SelectTrigger>
                  <SelectContent>
                    {["New", "Follow Up", "Negotiation", "Won", "Lost"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button onClick={handleSave}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
      onDelete={handleDelete}
    />
  );
}

export function InvoiceRowActions({ row, clients }: { row: InvoiceRow; clients: ClientOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(String(row.clientId));
  const [subtotal, setSubtotal] = useState(String(row.subtotal));
  const [tax, setTax] = useState(String(row.tax));
  const [dueDate, setDueDate] = useState(row.dueDate ? row.dueDate.slice(0, 10) : "");
  const selectedClientName = clients.find((client) => String(client.id) === clientId)?.name;

  const total = useMemo(() => parseMoneyInput(subtotal) + parseMoneyInput(tax), [subtotal, tax]);

  const handleDelete = async () => {
    if (!confirm(`Hapus invoice #${row.id}?`)) return;
    try {
      await requestJson(`/api/invoices/${row.id}`, "DELETE");
      toast.success("Invoice dihapus");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal hapus invoice");
    }
  };

  const handleSave = async () => {
    try {
      await requestJson(`/api/invoices/${row.id}`, "PATCH", {
        clientId,
        subtotal,
        tax,
        total,
        dueDate,
      });
      toast.success("Invoice diupdate");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal update invoice");
    }
  };

  return (
    <RowActionsMenu
      editDialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<DropdownMenuItem onClick={(event) => event.preventDefault()}><Pencil className="size-4" /> Edit</DropdownMenuItem>} />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
              <DialogDescription>Perbarui data invoice.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={(value) => setClientId(value ?? "") }>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Pilih client">{selectedClientName}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Subtotal</Label>
                <MoneyInput value={subtotal} onChange={setSubtotal} placeholder="50.000.000" />
              </div>
              <div className="grid gap-2">
                <Label>PPN</Label>
                <MoneyInput value={tax} onChange={setTax} placeholder="5.500.000" />
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                Total: <span className="font-semibold">Rp {formatMoneyInput(total)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button onClick={handleSave}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
      onDelete={handleDelete}
    />
  );
}

export function PaymentRowActions({ row, clients, invoices }: { row: PaymentRow; clients: ClientOption[]; invoices: InvoiceOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(String(row.clientId));
  const [invoiceId, setInvoiceId] = useState(String(row.invoiceId));
  const [amount, setAmount] = useState(String(row.amount));
  const [paymentMethod, setPaymentMethod] = useState(row.paymentMethod ?? "");
  const [referenceCode, setReferenceCode] = useState(row.referenceCode ?? "");
  const selectedClientName = clients.find((client) => String(client.id) === clientId)?.name;
  const selectedInvoiceCode = invoices.find((invoice) => String(invoice.id) === invoiceId)?.code;

  const handleDelete = async () => {
    if (!confirm(`Hapus payment #${row.id}?`)) return;
    try {
      await requestJson(`/api/payments/${row.id}`, "DELETE");
      toast.success("Payment dihapus");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal hapus payment");
    }
  };

  const handleSave = async () => {
    try {
      await requestJson(`/api/payments/${row.id}`, "PATCH", {
        clientId,
        invoiceId,
        amount,
        paymentMethod,
        referenceCode,
      });
      toast.success("Payment diupdate");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal update payment");
    }
  };

  return (
    <RowActionsMenu
      editDialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<DropdownMenuItem onClick={(event) => event.preventDefault()}><Pencil className="size-4" /> Edit</DropdownMenuItem>} />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Payment</DialogTitle>
              <DialogDescription>Perbarui data pembayaran masuk.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={(value) => setClientId(value ?? "") }>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Pilih client">{selectedClientName}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Invoice</Label>
                <Select value={invoiceId} onValueChange={(value) => setInvoiceId(value ?? "") }>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Pilih invoice">{selectedInvoiceCode}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {invoices.map((invoice) => <SelectItem key={invoice.id} value={String(invoice.id)}>{invoice.code}{invoice.clientName ? ` — ${invoice.clientName}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Amount</Label>
                <MoneyInput value={amount} onChange={setAmount} placeholder="10.000.000" />
              </div>
              <div className="grid gap-2">
                <Label>Payment Method</Label>
                <Input value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Reference Code</Label>
                <Input value={referenceCode} onChange={(event) => setReferenceCode(event.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button onClick={handleSave}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
      onDelete={handleDelete}
    />
  );
}

function RowActionsMenu({ editDialog, onDelete }: { editDialog: React.ReactNode; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 w-8 px-0 rounded-full" />}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {editDialog}
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
