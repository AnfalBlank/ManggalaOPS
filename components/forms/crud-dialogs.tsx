"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
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
};

type LeadDialogProps = {
  clients: ClientOption[];
};

type InvoiceDialogProps = {
  clients: ClientOption[];
};

type PaymentDialogProps = {
  clients: ClientOption[];
  invoices: InvoiceOption[];
};

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

export function CreateLeadDialog({ clients }: LeadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [status, setStatus] = useState("New");

  const canSubmit = clientId && serviceName.trim();

  const reset = () => {
    setClientId("");
    setServiceName("");
    setEstimatedValue("");
    setStatus("New");
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await postJson("/api/leads", {
        clientId,
        serviceName,
        estimatedValue,
        status,
      });
      toast.success("Lead berhasil ditambahkan");
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2 shadow-sm" />}>
        <Plus className="size-4" /> Add New Lead
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Lead Baru</DialogTitle>
          <DialogDescription>Masukkan prospek baru ke pipeline sales.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={(value) => setClientId(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lead-service">Service Need</Label>
            <Input id="lead-service" value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder="Contoh: ERP System Development" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lead-value">Estimated Value</Label>
            <MoneyInput id="lead-value" value={estimatedValue} onChange={setEstimatedValue} placeholder="850.000.000" />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value ?? "New")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["New", "Follow Up", "Negotiation", "Won", "Lost"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateInvoiceDialog({ clients }: InvoiceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [tax, setTax] = useState("");
  const [dueDate, setDueDate] = useState("");

  const total = useMemo(() => parseMoneyInput(subtotal) + parseMoneyInput(tax), [subtotal, tax]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await postJson("/api/invoices", {
        clientId,
        subtotal,
        tax,
        dueDate,
        total,
      });
      toast.success("Invoice berhasil dibuat");
      setOpen(false);
      setClientId("");
      setSubtotal("");
      setTax("");
      setDueDate("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2 shadow-sm" />}>
        <Plus className="size-4" /> Create Invoice
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Invoice Baru</DialogTitle>
          <DialogDescription>Invoice baru akan langsung tercatat ke billing.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={(value) => setClientId(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invoice-subtotal">Subtotal</Label>
            <MoneyInput id="invoice-subtotal" value={subtotal} onChange={setSubtotal} placeholder="225.000.000" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invoice-tax">PPN</Label>
            <MoneyInput id="invoice-tax" value={tax} onChange={setTax} placeholder="24.750.000" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invoice-due-date">Due Date</Label>
            <Input id="invoice-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            Total invoice: <span className="font-semibold">Rp {formatMoneyInput(total)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!clientId || total <= 0 || loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RecordPaymentDialog({ clients, invoices }: PaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [referenceCode, setReferenceCode] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await postJson("/api/payments", {
        clientId,
        invoiceId,
        amount,
        paymentMethod,
        referenceCode,
      });
      toast.success("Payment berhasil direkam");
      setOpen(false);
      setClientId("");
      setInvoiceId("");
      setAmount("");
      setReferenceCode("");
      setPaymentMethod("Bank Transfer");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal merekam payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2 shadow-sm" />}>
        <Plus className="size-4" /> Record Payment
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Catat pembayaran masuk agar dashboard finance ikut update.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={(value) => setClientId(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Invoice</Label>
            <Select value={invoiceId} onValueChange={(value) => setInvoiceId(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih invoice" />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={String(invoice.id)}>
                    {invoice.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payment-amount">Amount</Label>
            <MoneyInput id="payment-amount" value={amount} onChange={setAmount} placeholder="65.000.000" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Input id="payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} placeholder="Bank Transfer (Mandiri)" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payment-reference">Reference Code</Label>
            <Input id="payment-reference" value={referenceCode} onChange={(event) => setReferenceCode(event.target.value)} placeholder="TRX-INV-0099" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!clientId || !invoiceId || parseMoneyInput(amount) <= 0 || loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
