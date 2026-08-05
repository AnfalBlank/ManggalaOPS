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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";

type ClientOption = {
  id: number;
  name: string;
};

type InvoiceOption = {
  id: number;
  code: string;
  clientId?: number;
  clientName?: string;
  total?: number;
  amountPaid?: number;
  outstanding?: number;
};

type PaymentAccountOption = {
  code: string;
  name: string;
};

type LeadDialogProps = {
  clients: ClientOption[];
};

type PaymentDialogProps = {
  clients: ClientOption[];
  invoices: InvoiceOption[];
  paymentAccounts?: PaymentAccountOption[];
};

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload;
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

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
      await postJson("/api/leads", { clientId, serviceName, estimatedValue, status });
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
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2 shadow-sm"><Plus className="size-4" /> Add New Lead</Button>} />
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
                <SelectValue placeholder="Pilih client">{clients.find((c) => String(c.id) === clientId)?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Service Need</Label>
            <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Contoh: ERP System Development" />
          </div>
          <div className="grid gap-2">
            <Label>Estimated Value</Label>
            <MoneyInput value={estimatedValue} onChange={setEstimatedValue} placeholder="850.000.000" />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value ?? "New")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["New", "Follow Up", "Negotiation", "Won", "Lost"].map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
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

export function RecordPaymentDialog({ clients, invoices, paymentAccounts = [] }: PaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [isPartial, setIsPartial] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentAccountCode, setPaymentAccountCode] = useState(paymentAccounts[0]?.code ?? "1002");
  const [referenceCode, setReferenceCode] = useState("");

  // Invoices filtered by selected client — only unpaid/partial (already filtered in options API).
  const filteredInvoices = useMemo(
    () => invoices.filter((inv) => !clientId || String(inv.clientId ?? "") === clientId),
    [invoices, clientId],
  );

  const selectedInvoice = useMemo(
    () => filteredInvoices.find((inv) => String(inv.id) === invoiceId),
    [filteredInvoices, invoiceId],
  );

  // When invoice selected, auto-fill amount with outstanding balance.
  const handleInvoiceChange = (id: string | null) => {
    const safeId = id ?? "";
    setInvoiceId(safeId);
    setIsPartial(false);
    const inv = filteredInvoices.find((i) => String(i.id) === safeId);
    if (inv?.outstanding) {
      setAmount(String(inv.outstanding));
    } else {
      setAmount("");
    }
  };

  // When partial checkbox toggled OFF, reset amount to outstanding.
  const handlePartialToggle = (checked: boolean) => {
    setIsPartial(checked);
    if (!checked && selectedInvoice?.outstanding) {
      setAmount(String(selectedInvoice.outstanding));
    } else if (checked) {
      setAmount("");
    }
  };

  const parsedAmount = useMemo(() => parseMoneyInput(amount), [amount]);
  const maxAmount = selectedInvoice?.outstanding ?? 0;

  const reset = () => {
    setClientId("");
    setInvoiceId("");
    setIsPartial(false);
    setAmount("");
    setReferenceCode("");
    setPaymentMethod("Bank Transfer");
    setPaymentAccountCode(paymentAccounts[0]?.code ?? "1002");
  };

  const canSubmit = clientId && invoiceId && parsedAmount > 0 &&
    (isPartial ? parsedAmount < maxAmount : parsedAmount === maxAmount || parsedAmount <= maxAmount);

  const handleSubmit = async () => {
    if (!isPartial && maxAmount > 0 && parsedAmount > maxAmount) {
      toast.error(`Amount melebihi outstanding invoice (${formatRupiah(maxAmount)})`);
      return;
    }
    try {
      setLoading(true);
      await postJson("/api/payments", {
        clientId,
        invoiceId,
        amount,
        paymentMethod,
        paymentAccountCode,
        referenceCode,
      });
      toast.success("Payment berhasil direkam");
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal merekam payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2 shadow-sm"><Plus className="size-4" /> Record Payment</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Catat pembayaran masuk. Hanya invoice yang belum lunas ditampilkan.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {/* Client */}
          <div className="grid gap-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={(v) => { setClientId(v ?? ""); setInvoiceId(""); setAmount(""); setIsPartial(false); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih client">{clients.find((c) => String(c.id) === clientId)?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice — only unpaid ones */}
          <div className="grid gap-2">
            <Label>Invoice</Label>
            <Select value={invoiceId} onValueChange={handleInvoiceChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih invoice (belum lunas)">
                  {filteredInvoices.find((inv) => String(inv.id) === invoiceId)?.code}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredInvoices.length === 0 ? (
                  <div className="py-3 px-4 text-sm text-muted-foreground">Tidak ada invoice outstanding</div>
                ) : filteredInvoices.map((inv) => (
                  <SelectItem key={inv.id} value={String(inv.id)}>
                    <span className="font-medium">{inv.code}</span>
                    {inv.outstanding != null ? (
                      <span className="ml-2 text-xs text-muted-foreground">sisa {formatRupiah(inv.outstanding)}</span>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Invoice detail box */}
            {selectedInvoice ? (
              <div className="rounded-lg border bg-muted/20 p-3 text-xs grid grid-cols-3 gap-2">
                <div>
                  <div className="text-muted-foreground uppercase">Total</div>
                  <div className="font-semibold">{formatRupiah(selectedInvoice.total ?? 0)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground uppercase">Terbayar</div>
                  <div className="font-semibold text-emerald-700">{formatRupiah(selectedInvoice.amountPaid ?? 0)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground uppercase">Outstanding</div>
                  <div className="font-semibold text-amber-700">{formatRupiah(selectedInvoice.outstanding ?? 0)}</div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Partial payment toggle */}
          {selectedInvoice ? (
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-dashed p-3 hover:bg-muted/20">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                checked={isPartial}
                onChange={(e) => handlePartialToggle(e.target.checked)}
              />
              <div>
                <div className="text-sm font-medium">Bayar sebagian (partial payment)</div>
                <div className="text-xs text-muted-foreground">
                  Centang jika jumlah yang dibayarkan tidak sama dengan sisa tagihan penuh.
                </div>
              </div>
            </label>
          ) : null}

          {/* Amount */}
          <div className="grid gap-2">
            <Label>
              Amount
              {!isPartial && maxAmount > 0 ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">(auto-filled dari outstanding)</span>
              ) : null}
            </Label>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              placeholder={maxAmount > 0 ? String(maxAmount) : "65.000.000"}
              disabled={!isPartial && !!selectedInvoice}
            />
            {isPartial && maxAmount > 0 && parsedAmount >= maxAmount ? (
              <p className="text-xs text-rose-600">
                Amount partial tidak boleh ≥ outstanding ({formatRupiah(maxAmount)}). Hilangkan centang partial untuk bayar lunas.
              </p>
            ) : null}
          </div>

          {/* Payment account */}
          <div className="grid gap-2">
            <Label>Akun Penerimaan</Label>
            <Select value={paymentAccountCode} onValueChange={(v) => setPaymentAccountCode(v ?? "1002")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Pilih akun" /></SelectTrigger>
              <SelectContent>
                {paymentAccounts.map((account) => (
                  <SelectItem key={account.code} value={account.code}>{account.code} - {account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment method */}
          <div className="grid gap-2">
            <Label>Payment Method</Label>
            <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Bank Transfer (Mandiri)" />
          </div>

          {/* Reference */}
          <div className="grid gap-2">
            <Label>Reference Code</Label>
            <Input value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} placeholder="TRX-INV-0099" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || loading || (isPartial && parsedAmount >= maxAmount && maxAmount > 0)}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
