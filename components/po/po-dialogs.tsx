"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { RupiahInput } from "@/components/forms/rupiah-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { parseMoneyInput } from "@/lib/money";

async function kirim(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
  return data;
}

const hariIni = () => new Date().toISOString().slice(0, 10);
const tambahHari = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function Isian({ label, children, wajib, className }: { label: string; children: React.ReactNode; wajib?: boolean; className?: string }) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label>
        {label}
        {wajib ? <span className="text-rose-600"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}

function UnggahFile({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-slate-50">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
        {value ? "Ganti file" : "Pilih file PDF / foto"}
        <input
          type="file"
          accept="application/pdf,image/*"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setLoading(true);
            try {
              const fd = new FormData();
              fd.append("file", f);
              const res = await fetch("/api/upload", { method: "POST", body: fd });
              const d = await res.json();
              if (!res.ok) throw new Error(d.error ?? "Upload gagal");
              onChange(d.url);
              toast.success("File PO keupload");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Upload gagal");
            } finally {
              setLoading(false);
            }
          }}
        />
      </label>
      {value ? (
        <a href={value.replace(/^\/uploads\//, "/api/uploads/")} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline">
          Lihat file
        </a>
      ) : null}
    </div>
  );
}

export type PenawaranPilihan = { id: number; code: string; clientName: string; subject: string | null; total: number; status: string };

export function CatatPoDialog({ penawaran, terpilih, tombol }: { penawaran: PenawaranPilihan[]; terpilih?: number; tombol?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quotationId, setQuotationId] = useState(terpilih ? String(terpilih) : "");
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState(hariIni());
  const [value, setValue] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const q = penawaran.find((p) => String(p.id) === quotationId);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && q && !value) setValue(String(q.total));
      }}
    >
      <DialogTrigger
        render={
          tombol ? (
            (tombol as React.ReactElement)
          ) : (
            <Button className="gap-2">
              <Plus className="size-4" /> Catat PO klien
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catat PO / kontrak dari klien</DialogTitle>
          <DialogDescription>Penawaran otomatis jadi &quot;Diterima&quot; dan proyeknya dibikin. Tagihan dibikin nanti dari halaman PO.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {terpilih ? (
            <div className="rounded-lg border bg-slate-50 p-3 text-sm">
              <p className="font-medium">{q?.code} · {q?.clientName}</p>
              <p className="text-muted-foreground">{q?.subject || "-"} · {formatCurrency(q?.total ?? 0)}</p>
            </div>
          ) : (
            <Isian label="Penawaran" wajib>
              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={quotationId}
                onChange={(e) => {
                  setQuotationId(e.target.value);
                  const p = penawaran.find((x) => String(x.id) === e.target.value);
                  if (p) setValue(String(p.total));
                }}
              >
                <option value="">Pilih penawaran…</option>
                {penawaran.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.clientName} · {formatCurrency(p.total)}
                  </option>
                ))}
              </select>
            </Isian>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Isian label="Nomor PO / kontrak klien" wajib>
              <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Contoh: PO/2026/0153" />
            </Isian>
            <Isian label="Tanggal PO" wajib>
              <Input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} />
            </Isian>
          </div>
          <Isian label="Nilai PO (termasuk PPN)">
            <RupiahInput value={value} onChange={setValue} />
            {q && parseMoneyInput(value) !== q.total ? <p className="text-xs text-amber-700">Beda dari nilai penawaran ({formatCurrency(q.total)}).</p> : null}
          </Isian>
          <Isian label="File PO dari klien">
            <UnggahFile value={fileUrl} onChange={setFileUrl} />
          </Isian>
          <Isian label="Catatan">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional" />
          </Isian>
        </div>
        <DialogFooter>
          <Button
            disabled={loading}
            className="w-full sm:w-auto"
            onClick={async () => {
              setLoading(true);
              try {
                const r = await kirim("/api/po", "POST", { quotationId: Number(quotationId), poNumber, poDate, value, fileUrl, notes });
                toast.success("PO klien dicatat");
                setOpen(false);
                router.push(`/po/${r.id}`);
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null} Simpan PO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ItemPo = { id: number; description: string; qty: number; unit: string; unitPrice: number; unitCost: number; dikirim: number };
type Penerima = { name: string | null; company: string | null; address: string | null; phone: string | null };

export function SuratJalanDialog({ poId, items, penerima }: { poId: number; items: ItemPo[]; penerima: Penerima }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(hariIni());
  const [recipientName, setRecipientName] = useState(penerima.name ?? "");
  const [recipientCompany, setRecipientCompany] = useState(penerima.company ?? "");
  const [recipientAddress, setRecipientAddress] = useState(penerima.address ?? "");
  const [recipientPhone, setRecipientPhone] = useState(penerima.phone ?? "");
  const [driverName, setDriverName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [shippingMethod, setShippingMethod] = useState("Diantar sendiri");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState<Record<number, string>>(() => Object.fromEntries(items.map((i) => [i.id, String(Math.max(i.qty - i.dikirim, 0))])));
  const [seri, setSeri] = useState<Record<number, string>>({});
  const sisaAda = items.some((i) => i.qty - i.dikirim > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2" disabled={!sisaAda}>
            <Plus className="size-4" /> Bikin surat jalan
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Surat jalan baru</DialogTitle>
          <DialogDescription>Jumlah awal = sisa yang belum dikirim. Kirim sebagian? Kurangi jumlahnya.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Isian label="Tanggal kirim" wajib>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Isian>
            <Isian label="Cara kirim">
              <Input value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} placeholder="Diantar sendiri / ekspedisi" />
            </Isian>
            <Isian label="Nama pengirim / sopir">
              <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} />
            </Isian>
            <Isian label="No. kendaraan">
              <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="B 1234 XYZ" />
            </Isian>
            <Isian label="Nama penerima">
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </Isian>
            <Isian label="Perusahaan penerima">
              <Input value={recipientCompany} onChange={(e) => setRecipientCompany(e.target.value)} />
            </Isian>
            <Isian label="Telepon penerima">
              <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
            </Isian>
            <Isian label="Alamat kirim" className="sm:col-span-2">
              <Textarea rows={2} value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
            </Isian>
          </div>
          <div className="grid gap-2">
            <Label>Barang yang dikirim</Label>
            {items.map((i) => {
              const sisa = Math.max(i.qty - i.dikirim, 0);
              return (
                <div key={i.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-12 sm:items-end">
                  <div className="sm:col-span-6">
                    <p className="text-sm font-medium whitespace-pre-line line-clamp-3">{i.description}</p>
                    <p className="text-xs text-muted-foreground">
                      PO {i.qty} {i.unit} · udah dikirim {i.dikirim} · sisa {sisa}
                    </p>
                  </div>
                  <Isian label="Jumlah kirim" className="sm:col-span-2">
                    <Input type="number" min={0} max={sisa} disabled={sisa === 0} value={qty[i.id] ?? "0"} onChange={(e) => setQty({ ...qty, [i.id]: e.target.value })} />
                  </Isian>
                  <Isian label="No. seri / ket." className="sm:col-span-4">
                    <Input disabled={sisa === 0} value={seri[i.id] ?? ""} onChange={(e) => setSeri({ ...seri, [i.id]: e.target.value })} placeholder="Opsional" />
                  </Isian>
                </div>
              );
            })}
          </div>
          <Isian label="Catatan">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional, ikut tercetak" />
          </Isian>
        </div>
        <DialogFooter>
          <Button
            disabled={loading}
            className="w-full sm:w-auto"
            onClick={async () => {
              setLoading(true);
              try {
                await kirim(`/api/po/${poId}/surat-jalan`, "POST", {
                  date,
                  recipientName,
                  recipientCompany,
                  recipientAddress,
                  recipientPhone,
                  driverName,
                  vehicleNumber,
                  shippingMethod,
                  notes,
                  items: items.map((i) => ({ clientPoItemId: i.id, qty: qty[i.id] ?? 0, serialNumber: seri[i.id] ?? "" })),
                });
                toast.success("Surat jalan dibikin");
                setOpen(false);
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null} Simpan surat jalan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type BarisHarga = { description: string; qty: string; unit: string; unitPrice: string };

function DaftarBarisHarga({ rows, setRows, labelHarga }: { rows: BarisHarga[]; setRows: (r: BarisHarga[]) => void; labelHarga: string }) {
  return (
    <div className="grid gap-2">
      {rows.map((r, n) => (
        <div key={n} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-12 sm:items-end">
          <Isian label="Barang" className="sm:col-span-5">
            <Textarea rows={2} value={r.description} onChange={(e) => setRows(rows.map((x, i) => (i === n ? { ...x, description: e.target.value } : x)))} />
          </Isian>
          <Isian label="Jumlah" className="sm:col-span-2">
            <Input type="number" min={0} value={r.qty} onChange={(e) => setRows(rows.map((x, i) => (i === n ? { ...x, qty: e.target.value } : x)))} />
          </Isian>
          <Isian label="Satuan" className="sm:col-span-1">
            <Input value={r.unit} onChange={(e) => setRows(rows.map((x, i) => (i === n ? { ...x, unit: e.target.value } : x)))} />
          </Isian>
          <Isian label={labelHarga} className="sm:col-span-3">
            <RupiahInput value={r.unitPrice} onChange={(v) => setRows(rows.map((x, i) => (i === n ? { ...x, unitPrice: v } : x)))} />
          </Isian>
          <div className="sm:col-span-1 flex sm:justify-end">
            <Button type="button" variant="ghost" size="sm" className="text-rose-600" aria-label="Hapus baris" onClick={() => setRows(rows.filter((_, i) => i !== n))}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit gap-2" onClick={() => setRows([...rows, { description: "", qty: "1", unit: "Unit", unitPrice: "" }])}>
        <Plus className="size-4" /> Tambah barang
      </Button>
    </div>
  );
}

function hitung(rows: BarisHarga[], pajak: string) {
  const subtotal = rows.reduce((s, r) => s + (Number(r.qty) || 0) * parseMoneyInput(r.unitPrice), 0);
  const tax = Math.round(subtotal * ((Number(pajak) || 0) / 100));
  return { subtotal, tax, total: subtotal + tax };
}

function Ringkasan({ rows, pajak }: { rows: BarisHarga[]; pajak: string }) {
  const { subtotal, tax, total } = useMemo(() => hitung(rows, pajak), [rows, pajak]);
  return (
    <div className="rounded-lg border bg-slate-50 p-3 text-sm grid gap-1">
      <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
      <div className="flex justify-between"><span>PPN {pajak}%</span><span>{formatCurrency(tax)}</span></div>
      <div className="flex justify-between font-semibold border-t pt-1 mt-1"><span>Total</span><span>{formatCurrency(total)}</span></div>
    </div>
  );
}

export function PoSupplierDialog({ poId, items }: { poId: number; items: ItemPo[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [date, setDate] = useState(hariIni());
  const [expectedDate, setExpectedDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [taxPercent, setTaxPercent] = useState("11");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<BarisHarga[]>(() =>
    items.map((i) => ({ description: i.description, qty: String(i.qty), unit: i.unit, unitPrice: i.unitCost ? String(i.unitCost) : "" })),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2">
            <Plus className="size-4" /> Bikin PO ke supplier
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PO ke supplier</DialogTitle>
          <DialogDescription>Barang & harga awal diambil dari PO klien (harga = modal di penawaran). Hapus barang yang gak dibeli ke supplier ini.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Isian label="Nama supplier" wajib>
              <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
            </Isian>
            <Isian label="Kontak (Up.)">
              <Input value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} />
            </Isian>
            <Isian label="Telepon">
              <Input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} />
            </Isian>
            <Isian label="Pembayaran">
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Contoh: Tempo 30 hari" />
            </Isian>
            <Isian label="Tanggal PO" wajib>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Isian>
            <Isian label="Dikirim paling lambat">
              <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </Isian>
            <Isian label="Alamat supplier" className="sm:col-span-2">
              <Textarea rows={2} value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} />
            </Isian>
          </div>
          <DaftarBarisHarga rows={rows} setRows={setRows} labelHarga="Harga beli satuan" />
          <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
            <Isian label="PPN (%)">
              <Input type="number" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
            </Isian>
            <Ringkasan rows={rows} pajak={taxPercent} />
          </div>
          <Isian label="Catatan di PO">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional, ikut tercetak" />
          </Isian>
        </div>
        <DialogFooter>
          <Button
            disabled={loading}
            className="w-full sm:w-auto"
            onClick={async () => {
              setLoading(true);
              try {
                await kirim(`/api/po/${poId}/supplier`, "POST", { supplierName, supplierContact, supplierPhone, supplierAddress, date, expectedDate, paymentTerms, notes, taxPercent, items: rows });
                toast.success("PO supplier dibikin");
                setOpen(false);
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null} Simpan PO supplier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TagihanDariPoDialog({
  po,
  items,
  bawaan,
  penerima,
  sisaTagih,
}: {
  po: { id: number; clientId: number; projectId: number | null; quotationId: number; poNumber: string };
  items: ItemPo[];
  bawaan: { subject: string | null; paymentMethod: string | null; taxPercent: number; dueDays: number; signatoryName: string | null; signatoryTitle: string | null };
  penerima: Penerima;
  sisaTagih: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(hariIni());
  const [dueDate, setDueDate] = useState(tambahHari(hariIni(), bawaan.dueDays || 14));
  const [taxPercent, setTaxPercent] = useState(String(bawaan.taxPercent ?? 11));
  const [rows, setRows] = useState<BarisHarga[]>(() =>
    items.map((i) => ({ description: i.description, qty: String(i.qty), unit: i.unit, unitPrice: String(i.unitPrice) })),
  );
  const { total } = hitung(rows, taxPercent);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2" disabled={sisaTagih <= 0}>
            <Plus className="size-4" /> Bikin tagihan
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tagihan dari PO {po.poNumber}</DialogTitle>
          <DialogDescription>Barang & harga diambil dari PO. Nagih sebagian (termin)? Ubah jumlah atau harganya.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Isian label="Tanggal tagihan" wajib>
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setDueDate(tambahHari(e.target.value, bawaan.dueDays || 14));
                }}
              />
            </Isian>
            <Isian label="Jatuh tempo">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Isian>
            <Isian label="PPN (%)">
              <Input type="number" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
            </Isian>
          </div>
          <DaftarBarisHarga rows={rows} setRows={setRows} labelHarga="Harga jual satuan" />
          <Ringkasan rows={rows} pajak={taxPercent} />
          {total > sisaTagih + 1 ? (
            <p className="text-sm text-amber-700">Total tagihan ini lebih besar dari sisa nilai PO yang belum ditagih ({formatCurrency(sisaTagih)}).</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            disabled={loading}
            className="w-full sm:w-auto"
            onClick={async () => {
              setLoading(true);
              try {
                await kirim("/api/invoices", "POST", {
                  clientId: po.clientId,
                  projectId: po.projectId,
                  quotationId: po.quotationId,
                  clientPoId: po.id,
                  date,
                  dueDate,
                  taxPercent,
                  paymentMethod: bawaan.paymentMethod ?? "CBD",
                  subject: "Invoice",
                  recipientName: penerima.name,
                  recipientCompany: penerima.company,
                  recipientAddress: penerima.address,
                  signatoryName: bawaan.signatoryName,
                  signatoryTitle: bawaan.signatoryTitle,
                  items: rows
                    .filter((r) => r.description.trim() && Number(r.qty) > 0)
                    .map((r) => ({ description: r.description, qty: r.qty, unit: r.unit, unitPrice: parseMoneyInput(r.unitPrice), amount: (Number(r.qty) || 0) * parseMoneyInput(r.unitPrice) })),
                });
                toast.success("Tagihan dibikin");
                setOpen(false);
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null} Simpan tagihan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
