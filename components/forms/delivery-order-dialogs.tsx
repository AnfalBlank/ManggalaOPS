"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ClientOption = { id: number; name: string };
type ProjectOption = { id: number; name: string; clientId: number; clientName: string };
type InvoiceOption = { id: number; code: string; clientId: number; clientName: string };

type DeliveryOrderItemForm = {
  description: string;
  qty: string;
  unit: string;
  serialNumber: string;
  notes: string;
};

type DeliveryOrderForm = {
  id?: number;
  clientId?: number | null;
  projectId?: number | null;
  invoiceId?: number | null;
  date?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  shippingMethod?: string | null;
  recipientName?: string | null;
  recipientCompany?: string | null;
  recipientAddress?: string | null;
  recipientPhone?: string | null;
  subject?: string | null;
  introduction?: string | null;
  notes?: string | null;
  closingNote?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  status?: string | null;
  items?: Array<{ description: string; qty: number; unit: string | null; serialNumber: string | null; notes: string | null }>;
};

const SHIPPING_METHODS = ["Direct Delivery", "Kurir Internal", "Ekspedisi", "Pickup"];
const DEFAULT_INTRO =
  "Bersama ini kami sampaikan pengiriman barang dengan rincian sebagai berikut. Mohon diperiksa dan ditandatangani sebagai bukti penerimaan.";
const DEFAULT_NOTES =
  "1. Barang yang sudah diterima tidak dapat dikembalikan kecuali ada perjanjian khusus.\n2. Pemeriksaan barang dilakukan saat barang diterima.\n3. Surat jalan ini sah tanpa tanda tangan basah jika dikirim secara digital.";
const DEFAULT_CLOSING = "Demikian surat jalan ini kami sampaikan. Atas kerjasamanya kami ucapkan terima kasih.";

async function send(url: string, method: string, body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload;
}

export function DeliveryOrderDialog({
  clients,
  projects,
  invoices,
  delivery,
  defaultSignatoryName,
  defaultSignatoryTitle,
  triggerLabel,
}: {
  clients: ClientOption[];
  projects: ProjectOption[];
  invoices: InvoiceOption[];
  delivery?: DeliveryOrderForm;
  defaultSignatoryName?: string | null;
  defaultSignatoryTitle?: string | null;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string>(delivery?.clientId ? String(delivery.clientId) : "");
  const [projectId, setProjectId] = useState<string>(delivery?.projectId ? String(delivery.projectId) : "");
  const [invoiceId, setInvoiceId] = useState<string>(delivery?.invoiceId ? String(delivery.invoiceId) : "");
  const [date, setDate] = useState<string>(delivery?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [vehicleNumber, setVehicleNumber] = useState<string>(delivery?.vehicleNumber ?? "");
  const [driverName, setDriverName] = useState<string>(delivery?.driverName ?? "");
  const [shippingMethod, setShippingMethod] = useState<string>(delivery?.shippingMethod ?? "Direct Delivery");
  const [recipientName, setRecipientName] = useState<string>(delivery?.recipientName ?? "");
  const [recipientCompany, setRecipientCompany] = useState<string>(delivery?.recipientCompany ?? "");
  const [recipientAddress, setRecipientAddress] = useState<string>(delivery?.recipientAddress ?? "");
  const [recipientPhone, setRecipientPhone] = useState<string>(delivery?.recipientPhone ?? "");
  const [subject, setSubject] = useState<string>(delivery?.subject ?? "Surat Jalan");
  const [introduction, setIntroduction] = useState<string>(delivery?.introduction ?? DEFAULT_INTRO);
  const [notes, setNotes] = useState<string>(delivery?.notes ?? DEFAULT_NOTES);
  const [closingNote, setClosingNote] = useState<string>(delivery?.closingNote ?? DEFAULT_CLOSING);
  const [signatoryName, setSignatoryName] = useState<string>(delivery?.signatoryName ?? defaultSignatoryName ?? "Adiatma Pasau");
  const [signatoryTitle, setSignatoryTitle] = useState<string>(delivery?.signatoryTitle ?? defaultSignatoryTitle ?? "Manager Marketing");
  const [status, setStatus] = useState<string>(delivery?.status ?? "Draft");
  const [items, setItems] = useState<DeliveryOrderItemForm[]>(
    delivery?.items?.length
      ? delivery.items.map((item) => ({
          description: item.description,
          qty: String(item.qty),
          unit: item.unit ?? "Unit",
          serialNumber: item.serialNumber ?? "",
          notes: item.notes ?? "",
        }))
      : [{ description: "", qty: "1", unit: "Unit", serialNumber: "", notes: "" }],
  );

  // When an invoice is selected, prefill recipient + items if empty.
  useEffect(() => {
    if (!invoiceId) return;
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/invoices");
        if (!response.ok) return;
        const all = await response.json();
        const invoice = (all as Array<{ id: number; clientId: number; clientName: string; projectId: number | null; recipientName: string | null; recipientCompany: string | null; recipientAddress: string | null; subject: string | null; signatoryName: string | null; signatoryTitle: string | null; items: Array<{ description: string; qty: number; unit: string | null }> }>)
          .find((row) => String(row.id) === invoiceId);
        if (!invoice || !active) return;

        if (!clientId) setClientId(String(invoice.clientId));
        if (!projectId && invoice.projectId) setProjectId(String(invoice.projectId));
        setRecipientName((value) => value || invoice.recipientName || invoice.clientName);
        setRecipientCompany((value) => value || invoice.recipientCompany || invoice.clientName);
        setRecipientAddress((value) => value || invoice.recipientAddress || "");
        setSubject((value) => (value && value !== "Surat Jalan" ? value : invoice.subject ? `Surat Jalan: ${invoice.subject}` : "Surat Jalan"));
        setSignatoryName((value) => value || invoice.signatoryName || defaultSignatoryName || "Adiatma Pasau");
        setSignatoryTitle((value) => value || invoice.signatoryTitle || defaultSignatoryTitle || "Manager Marketing");
        if (invoice.items?.length && items.every((item) => !item.description)) {
          setItems(invoice.items.map((item) => ({
            description: item.description,
            qty: String(item.qty),
            unit: item.unit ?? "Unit",
            serialNumber: "",
            notes: "",
          })));
        }
      } catch {
        // ignore
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const filteredProjects = useMemo(() => {
    if (!clientId) return projects;
    return projects.filter((project) => String(project.clientId) === clientId);
  }, [clientId, projects]);

  const filteredInvoices = useMemo(() => {
    if (!clientId) return invoices;
    return invoices.filter((invoice) => String(invoice.clientId) === clientId);
  }, [clientId, invoices]);

  const isValid =
    clientId.length > 0 &&
    items.length > 0 &&
    items.every((item) => item.description.trim().length > 0 && Number(item.qty) > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={delivery ? <Button variant="outline" size="sm">Edit</Button> : <Button className="gap-2"><Plus className="size-4" /> {triggerLabel ?? "Buat Surat Jalan"}</Button>} />
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{delivery ? "Edit Surat Jalan" : "Buat Surat Jalan"}</DialogTitle>
          <DialogDescription>
            {delivery ? "Update data surat jalan." : "Buat surat jalan untuk pengiriman barang. Bisa dibuat dari invoice atau manual."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={(value) => setClientId(value ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Tanggal Pengiriman</Label>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Project (opsional)</Label>
              <Select value={projectId} onValueChange={(value) => setProjectId(value ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih project" /></SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Referensi Invoice (opsional)</Label>
              <Select value={invoiceId} onValueChange={(value) => setInvoiceId(value ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih invoice" /></SelectTrigger>
                <SelectContent>
                  {filteredInvoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={String(invoice.id)}>{invoice.code} • {invoice.clientName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Metode Pengiriman</Label>
              <Select value={shippingMethod} onValueChange={(value) => setShippingMethod(value ?? "Direct Delivery")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                <SelectContent>
                  {SHIPPING_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value ?? "Draft")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>No. Kendaraan</Label>
              <Input value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} placeholder="B 1234 ABC" />
            </div>
            <div className="grid gap-2">
              <Label>Nama Driver</Label>
              <Input value={driverName} onChange={(event) => setDriverName(event.target.value)} />
            </div>
          </div>

          <div className="rounded-xl border p-4 space-y-4">
            <h3 className="font-semibold">Penerima</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2"><Label>Nama Penerima</Label><Input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} /></div>
              <div className="grid gap-2"><Label>Perusahaan</Label><Input value={recipientCompany} onChange={(event) => setRecipientCompany(event.target.value)} /></div>
              <div className="grid gap-2 md:col-span-2"><Label>Alamat Pengiriman</Label><Textarea rows={2} value={recipientAddress} onChange={(event) => setRecipientAddress(event.target.value)} /></div>
              <div className="grid gap-2"><Label>No. Telepon Penerima</Label><Input value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} /></div>
              <div className="grid gap-2"><Label>Perihal</Label><Input value={subject} onChange={(event) => setSubject(event.target.value)} /></div>
            </div>
          </div>

          <div className="rounded-xl border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Item Barang</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItems([...items, { description: "", qty: "1", unit: "Unit", serialNumber: "", notes: "" }])}
              >
                Tambah Item
              </Button>
            </div>
            <div className="grid gap-3">
              {items.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <Label>Uraian</Label>
                    <Textarea
                      rows={2}
                      value={item.description}
                      onChange={(event) =>
                        setItems(items.map((row, i) => (i === index ? { ...row, description: event.target.value } : row)))
                      }
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(event) =>
                        setItems(items.map((row, i) => (i === index ? { ...row, qty: event.target.value } : row)))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Unit</Label>
                    <Input
                      value={item.unit}
                      onChange={(event) =>
                        setItems(items.map((row, i) => (i === index ? { ...row, unit: event.target.value } : row)))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Serial Number</Label>
                    <Input
                      value={item.serialNumber}
                      onChange={(event) =>
                        setItems(items.map((row, i) => (i === index ? { ...row, serialNumber: event.target.value } : row)))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Catatan Item</Label>
                    <Input
                      value={item.notes}
                      onChange={(event) =>
                        setItems(items.map((row, i) => (i === index ? { ...row, notes: event.target.value } : row)))
                      }
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    {items.length > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setItems(items.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4 space-y-4">
            <h3 className="font-semibold">Catatan & Tanda Tangan</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2"><Label>Pembuka Surat</Label><Textarea rows={2} value={introduction} onChange={(event) => setIntroduction(event.target.value)} /></div>
              <div className="grid gap-2 md:col-span-2"><Label>Catatan Pengiriman</Label><Textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
              <div className="grid gap-2 md:col-span-2"><Label>Closing Note</Label><Textarea rows={2} value={closingNote} onChange={(event) => setClosingNote(event.target.value)} /></div>
              <div className="grid gap-2"><Label>Nama Penanda Tangan</Label><Input value={signatoryName} onChange={(event) => setSignatoryName(event.target.value)} /></div>
              <div className="grid gap-2"><Label>Jabatan Penanda Tangan</Label><Input value={signatoryTitle} onChange={(event) => setSignatoryTitle(event.target.value)} /></div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button
            disabled={loading || !isValid}
            onClick={async () => {
              try {
                setLoading(true);
                await send(delivery?.id ? `/api/delivery-orders/${delivery.id}` : "/api/delivery-orders", delivery?.id ? "PATCH" : "POST", {
                  clientId,
                  projectId: projectId || null,
                  invoiceId: invoiceId || null,
                  date,
                  vehicleNumber,
                  driverName,
                  shippingMethod,
                  recipientName,
                  recipientCompany,
                  recipientAddress,
                  recipientPhone,
                  subject,
                  introduction,
                  notes,
                  closingNote,
                  signatoryName,
                  signatoryTitle,
                  status,
                  items: items.map((item) => ({
                    description: item.description.trim(),
                    qty: Number(item.qty) || 1,
                    unit: item.unit.trim() || "Unit",
                    serialNumber: item.serialNumber.trim() || null,
                    notes: item.notes.trim() || null,
                  })),
                });
                toast.success(delivery?.id ? "Surat jalan diupdate" : "Surat jalan dibuat");
                setOpen(false);
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan surat jalan");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
