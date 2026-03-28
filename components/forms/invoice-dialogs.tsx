"use client";

import { useMemo, useState } from "react";
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
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
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
  const [introduction, setIntroduction] = useState(invoice?.introduction ?? "Bersama ini kami sampaikan invoice/tagihan atas pekerjaan atau pengadaan yang telah kami laksanakan dengan rincian sebagai berikut:");
  const [terms, setTerms] = useState(invoice?.terms ?? "Pembayaran sesuai metode yang disepakati\nMohon mencantumkan nomor invoice pada transfer\nInvoice dianggap sah tanpa tanda tangan basah");
  const [closingNote, setClosingNote] = useState(invoice?.closingNote ?? "Demikian invoice ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.");
  const [signatoryName, setSignatoryName] = useState(invoice?.signatoryName ?? "Adiatma Pasau");
  const [signatoryTitle, setSignatoryTitle] = useState(invoice?.signatoryTitle ?? "Manager Marketing");
  const [tax, setTax] = useState(invoice ? String(invoice.tax) : "");
  const [items, setItems] = useState<Array<{ description: string; qty: string; unit: string; unitPrice: string }>>(
    invoice?.items?.length
      ? invoice.items.map((item) => ({ description: item.description, qty: String(item.qty), unit: item.unit || "Unit", unitPrice: String(item.unitPrice) }))
      : [{ description: "", qty: "1", unit: "Unit", unitPrice: "" }],
  );

  const computedItems = useMemo(() => items.map((item) => ({ ...item, amount: parseMoneyInput(item.unitPrice) * Number(item.qty || 0) })), [items]);
  const subtotal = useMemo(() => computedItems.reduce((sum, item) => sum + item.amount, 0), [computedItems]);
  const total = useMemo(() => subtotal + parseMoneyInput(tax), [subtotal, tax]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={invoice ? <Button variant="outline" size="sm">Edit</Button> : <Button className="gap-2"><Plus className="size-4" /> Create Invoice</Button>} />
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit Invoice" : "Tambah Invoice"}</DialogTitle>
          <DialogDescription>{invoice ? "Update invoice existing." : "Buat invoice lengkap dengan item, metode pembayaran, dan metadata surat."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2"><Label>Client</Label><Select value={clientId} onValueChange={(value) => setClientId(value ?? "")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih client" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Payment Method</Label><Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value ?? "CBD")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CBD">CBD</SelectItem><SelectItem value="Term">Term</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>PPN</Label><RupiahInput value={tax} onChange={setTax} placeholder="8.250.000" /></div>
          </div>

          <div className="rounded-xl border p-4 space-y-4">
            <h3 className="font-semibold">Metadata Invoice</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2"><Label>Lampiran</Label><Input value={attachment} onChange={(e) => setAttachment(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Perihal</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Kepada Yth.</Label><Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Perusahaan Penerima</Label><Input value={recipientCompany} onChange={(e) => setRecipientCompany(e.target.value)} /></div>
              <div className="grid gap-2 md:col-span-2"><Label>Alamat Penerima</Label><Input value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} /></div>
              <div className="grid gap-2 md:col-span-2"><Label>Pembuka Surat</Label><Textarea rows={3} value={introduction} onChange={(e) => setIntroduction(e.target.value)} /></div>
            </div>
          </div>

          <div className="rounded-xl border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Item Invoice</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { description: "", qty: "1", unit: "Unit", unitPrice: "" }])}>Tambah Item</Button>
            </div>
            <div className="grid gap-3">
              {items.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-12">
                  <div className="md:col-span-5"><Label>Uraian</Label><Textarea rows={3} value={item.description} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, description: e.target.value } : row))} /></div>
                  <div className="md:col-span-1"><Label>Qty</Label><Input type="number" value={item.qty} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, qty: e.target.value } : row))} /></div>
                  <div className="md:col-span-2"><Label>Unit</Label><Input value={item.unit} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, unit: e.target.value } : row))} /></div>
                  <div className="md:col-span-2"><Label>Harga Satuan</Label><RupiahInput value={item.unitPrice} onChange={(value) => setItems(items.map((row, i) => i === index ? { ...row, unitPrice: value } : row))} /></div>
                  <div className="md:col-span-2"><Label>Jumlah Harga</Label><div className="flex items-center gap-2"><Input readOnly value={`Rp ${formatMoneyInput(computedItems[index]?.amount ?? 0)}`} />{items.length > 1 ? <Button type="button" variant="outline" size="icon" onClick={() => setItems(items.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button> : null}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4 space-y-4">
            <h3 className="font-semibold">Terms & Signature</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2"><Label>Terms</Label><Textarea rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} /></div>
              <div className="grid gap-2 md:col-span-2"><Label>Closing Note</Label><Textarea rows={3} value={closingNote} onChange={(e) => setClosingNote(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Nama Penanda Tangan</Label><Input value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Jabatan Penanda Tangan</Label><Input value={signatoryTitle} onChange={(e) => setSignatoryTitle(e.target.value)} /></div>
            </div>
          </div>

          <div className="grid gap-2 rounded-xl border bg-muted/30 p-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">Rp {formatMoneyInput(subtotal)}</span></div>
            <div className="flex justify-between"><span>PPN</span><span className="font-medium">Rp {formatMoneyInput(tax)}</span></div>
            <div className="flex justify-between text-base font-semibold"><span>Total Invoice</span><span>Rp {formatMoneyInput(total)}</span></div>
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
                tax,
                items: computedItems.map((item) => ({ description: item.description, qty: Number(item.qty || 0), unit: item.unit, unitPrice: item.unitPrice, amount: item.amount })),
              });
              toast.success(invoice ? "Invoice diupdate" : "Invoice ditambahkan");
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal simpan invoice");
            } finally {
              setLoading(false);
            }
          }}>{loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
