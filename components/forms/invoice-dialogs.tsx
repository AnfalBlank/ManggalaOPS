"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { RupiahInput } from "@/components/forms/rupiah-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";

const LABEL_CARA_BAYAR: Record<string, string> = {
  CBD: "CBD (bayar sebelum barang dikirim)",
  Term: "Tempo (bayar setelah jatuh tempo)",
};

type ClientOption = { id: number; name: string };

type InvoiceItem = {
  id: number;
  description: string;
  qty: number;
  unit: string | null;
  unitPrice: number;
  amount: number;
};

type InvoiceRow = {
  id: number;
  code?: string;
  clientId: number;
  clientName?: string;
  projectName?: string | null;
  date?: string | null;
  dueDate: string | null;
  paymentMethod: string | null;
  attachment: string | null;
  subject: string | null;
  recipientName: string | null;
  recipientCompany: string | null;
  recipientAddress: string | null;
  introduction: string | null;
  terms: string | null;
  closingNote: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  subtotal?: number;
  tax: number;
  total?: number;
  amountPaid?: number;
  outstandingAmount?: number;
  status: string;
  items: InvoiceItem[];
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

export function InvoiceDialog({ clients, invoice }: { clients: ClientOption[]; invoice?: InvoiceRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(invoice ? String(invoice.clientId) : "");
  const [paymentMethod, setPaymentMethod] = useState(invoice?.paymentMethod ?? "CBD");
  const [dueDate, setDueDate] = useState(invoice?.dueDate?.slice(0, 10) ?? "");
  const [attachment, setAttachment] = useState(invoice?.attachment ?? "-");
  const [subject, setSubject] = useState(invoice?.subject ?? "Invoice");
  const [recipientName, setRecipientName] = useState(invoice?.recipientName ?? "");
  const [recipientCompany, setRecipientCompany] = useState(invoice?.recipientCompany ?? "");
  const [recipientAddress, setRecipientAddress] = useState(invoice?.recipientAddress ?? "Di tempat");
  const [introduction, setIntroduction] = useState(invoice?.introduction ?? "Bersama ini kami sampaikan tagihan atas pekerjaan atau pengadaan yang telah kami laksanakan dengan rincian sebagai berikut:");
  const [terms, setTerms] = useState(invoice?.terms ?? "Pembayaran sesuai metode yang disepakati\nMohon mencantumkan nomor tagihan pada transfer\nTagihan sah tanpa tanda tangan basah");
  const [closingNote, setClosingNote] = useState(invoice?.closingNote ?? "Demikian tagihan ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.");
  const [signatoryName, setSignatoryName] = useState(invoice?.signatoryName ?? "Adiatma Pasau");
  const [signatoryTitle, setSignatoryTitle] = useState(invoice?.signatoryTitle ?? "Manager Marketing");
  const [taxPercent, setTaxPercent] = useState(invoice && invoice.subtotal ? String(Number(((invoice.tax / invoice.subtotal) * 100).toFixed(2))) : "11");
  const [defaultTaxPercent, setDefaultTaxPercent] = useState(11);
  const selectedClientName = clients.find((client) => String(client.id) === clientId)?.name;
  const [items, setItems] = useState<Array<{ description: string; qty: string; unit: string; unitPrice: string }>>(
    invoice?.items?.length
      ? invoice.items.map((item) => ({ description: item.description, qty: String(item.qty), unit: item.unit || "Unit", unitPrice: String(item.unitPrice) }))
      : [{ description: "", qty: "1", unit: "Unit", unitPrice: "" }],
  );

  useEffect(() => {
    if (!open || invoice) return;
    let active = true;
    fetch("/api/settings")
      .then((response) => response.ok ? response.json() : null)
      .then((settings) => {
        if (!active || !settings) return;
        setPaymentMethod(String(settings.defaultPaymentMethod ?? "CBD"));
        const nextTaxPercent = Number(settings.defaultTaxPercent ?? 11) || 11;
        setDefaultTaxPercent(nextTaxPercent);
        setAttachment("-");
        setSubject("Invoice");
        setRecipientAddress(String(settings.companyAddress ?? "Di tempat") || "Di tempat");
        setIntroduction(`Bersama ini kami sampaikan tagihan dari ${settings.companyName ?? "PT. Manggala Utama Indonesia"} atas pekerjaan atau pengadaan yang telah kami laksanakan dengan rincian sebagai berikut:`);
        setTerms(`Pembayaran sesuai metode yang disepakati\nMohon mencantumkan nomor tagihan pada transfer\nTagihan jatuh tempo ${settings.invoiceDueDays ?? 14} hari`);
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + Number(settings.invoiceDueDays ?? 14));
        setDueDate(nextDueDate.toISOString().slice(0, 10));
        // Tagihan pakai penanda tangan tagihan/kwitansi dari Setelan (bukan penanda tangan penawaran).
        if (settings.defaultSignatoryName) setSignatoryName(String(settings.defaultSignatoryName));
        if (settings.defaultSignatoryTitle) setSignatoryTitle(String(settings.defaultSignatoryTitle));
      })
      .catch(() => null);
    return () => { active = false; };
  }, [invoice, open]);

  // Auto-fill recipient fields from client data when client is selected.
  const handleClientChange = (id: string | null) => {
    setClientId(id ?? "");
    if (!id) return;
    fetch(`/api/clients`)
      .then((r) => r.ok ? r.json() : null)
      .then((allClients: Array<{ id: number; name: string; contactPerson?: string | null; address?: string | null }> | null) => {
        if (!allClients) return;
        const found = allClients.find((c) => String(c.id) === id);
        if (!found) return;
        if (!recipientName) setRecipientName(found.contactPerson || found.name || "");
        if (!recipientCompany) setRecipientCompany(found.name || "");
        if (!recipientAddress || recipientAddress === "Di tempat") {
          setRecipientAddress(found.address || "Di tempat");
        }
      })
      .catch(() => null);
  };

  const computedItems = useMemo(() => items.map((item) => ({ ...item, amount: parseMoneyInput(item.unitPrice) * Number(item.qty || 0) })), [items]);
  const subtotal = useMemo(() => computedItems.reduce((sum, item) => sum + item.amount, 0), [computedItems]);

  useEffect(() => {
    if (invoice) return;
    setTaxPercent(String(defaultTaxPercent));
  }, [defaultTaxPercent, invoice]);

  const normalizedTaxPercent = useMemo(() => {
    const raw = Number(String(taxPercent).replace(",", "."));
    if (!Number.isFinite(raw) || raw < 0) return 0;
    return raw;
  }, [taxPercent]);
  const tax = useMemo(() => Math.round((subtotal * normalizedTaxPercent) / 100), [subtotal, normalizedTaxPercent]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={invoice ? <Button variant="outline" size="sm">Ubah</Button> : <Button className="gap-2"><Plus className="size-4" /> Bikin tagihan</Button>} />
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? `Ubah tagihan ${invoice.code ?? ""}`.trim() : "Bikin tagihan"}</DialogTitle>
          <DialogDescription>{invoice ? "Ubah isi tagihan ini. Total & PDF ikut berubah." : "Isi klien, barang/jasa yang ditagih, cara bayar, dan isi surat tagihan."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2"><Label>Klien</Label><Select value={clientId} onValueChange={handleClientChange}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih klien">{selectedClientName}</SelectValue></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Jatuh tempo</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Cara bayar</Label><Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value ?? "CBD")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih cara bayar">{(value: string) => LABEL_CARA_BAYAR[value] ?? value}</SelectValue></SelectTrigger><SelectContent><SelectItem value="CBD">{LABEL_CARA_BAYAR.CBD}</SelectItem><SelectItem value="Term">{LABEL_CARA_BAYAR.Term}</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>PPN (%)</Label><Input type="number" min="0" step="0.01" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} placeholder="11" /></div>
          </div>

          <div className="rounded-xl border p-4 space-y-4">
            <h3 className="font-semibold">Isi surat tagihan</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2"><Label>Lampiran</Label><Input value={attachment} onChange={(e) => setAttachment(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Perihal</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Kepada Yth.</Label><Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Perusahaan penerima</Label><Input value={recipientCompany} onChange={(e) => setRecipientCompany(e.target.value)} /></div>
              <div className="grid gap-2 md:col-span-2"><Label>Alamat penerima</Label><Input value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} /></div>
              <div className="grid gap-2 md:col-span-2"><Label>Kalimat pembuka</Label><Textarea rows={3} value={introduction} onChange={(e) => setIntroduction(e.target.value)} /></div>
            </div>
          </div>

          <div className="rounded-xl border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Barang/jasa yang ditagih</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { description: "", qty: "1", unit: "Unit", unitPrice: "" }])}>Tambah baris</Button>
            </div>
            <div className="grid gap-3">
              {items.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-12">
                  <div className="md:col-span-5"><Label>Uraian</Label><Textarea rows={3} value={item.description} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, description: e.target.value } : row))} /></div>
                  <div className="md:col-span-1"><Label>Qty</Label><Input type="number" value={item.qty} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, qty: e.target.value } : row))} /></div>
                  <div className="md:col-span-2"><Label>Satuan</Label><Input value={item.unit} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, unit: e.target.value } : row))} /></div>
                  <div className="md:col-span-2"><Label>Harga satuan</Label><RupiahInput value={item.unitPrice} onChange={(value) => setItems(items.map((row, i) => i === index ? { ...row, unitPrice: value } : row))} /></div>
                  <div className="md:col-span-2"><Label>Jumlah</Label><div className="flex items-center gap-2"><Input readOnly value={`Rp ${formatMoneyInput(computedItems[index]?.amount ?? 0)}`} />{items.length > 1 ? <Button type="button" variant="outline" size="icon" aria-label="Hapus baris" title="Hapus baris" onClick={() => setItems(items.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button> : null}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4 space-y-4">
            <h3 className="font-semibold">Syarat & penanda tangan</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2"><Label>Syarat pembayaran</Label><Textarea rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} /></div>
              <div className="grid gap-2 md:col-span-2"><Label>Kalimat penutup</Label><Textarea rows={3} value={closingNote} onChange={(e) => setClosingNote(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Nama penanda tangan</Label><Input value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Jabatan penanda tangan</Label><Input value={signatoryTitle} onChange={(e) => setSignatoryTitle(e.target.value)} /></div>
            </div>
          </div>

          <div className="grid gap-2 rounded-xl border bg-muted/30 p-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">Rp {formatMoneyInput(subtotal)}</span></div>
            <div className="flex justify-between"><span>PPN ({normalizedTaxPercent}%)</span><span className="font-medium">Rp {formatMoneyInput(tax)}</span></div>
            <div className="flex justify-between text-base font-semibold"><span>Total tagihan</span><span>Rp {formatMoneyInput(total)}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button disabled={loading || !clientId || total <= 0 || computedItems.some((item) => !item.description || item.amount <= 0)} onClick={async () => {
            try {
              setLoading(true);
              await send(invoice ? `/api/invoices/${invoice.id}` : "/api/invoices", invoice ? "PATCH" : "POST", {
                clientId,
                dueDate,
                paymentMethod,
                attachment,
                subject,
                recipientName,
                recipientCompany,
                recipientAddress,
                introduction,
                terms,
                closingNote,
                signatoryName,
                signatoryTitle,
                taxPercent: normalizedTaxPercent,
                items: computedItems.map((item) => ({ description: item.description, qty: Number(item.qty || 0), unit: item.unit, unitPrice: item.unitPrice, amount: item.amount })),
              });
              toast.success(invoice ? "Tagihan diperbarui" : "Tagihan dibuat");
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal menyimpan tagihan");
            } finally {
              setLoading(false);
            }
          }}>{loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
