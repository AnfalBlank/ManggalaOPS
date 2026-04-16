"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { RupiahInput } from "@/components/forms/rupiah-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseMoneyInput } from "@/lib/money";

type ClientOption = { id: number; name: string };
type ProjectOption = { id: number; name: string; clientId?: number; clientName?: string };
type ProjectRow = { id: number; clientId: number; name: string; value: number; status: string; progress: number; deadline: string | null };
type QuotationItem = { description: string; qty: number; unit: string | null; unitPrice: number; amount: number; imageUrl?: string | null };
type QuotationRow = {
  id: number;
  clientId: number;
  projectId: number | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string | null;
  validUntil: string | null;
  attachment?: string | null;
  subject?: string | null;
  recipientName?: string | null;
  recipientCompany?: string | null;
  recipientAddress?: string | null;
  introduction?: string | null;
  terms?: string | null;
  closingNote?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  items?: QuotationItem[];
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

function TriggerLabel({ text, placeholder }: { text?: string; placeholder: string }) {
  return <span className={text ? "truncate" : "text-muted-foreground truncate"}>{text || placeholder}</span>;
}

export function ProjectDialog({ clients, project }: { clients: ClientOption[]; project?: ProjectRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(project ? String(project.clientId) : "");
  const [name, setName] = useState(project?.name ?? "");
  const [value, setValue] = useState(project ? String(project.value) : "");
  const [status, setStatus] = useState(project?.status ?? "In Progress");
  const [progress, setProgress] = useState(project ? String(project.progress) : "0");
  const [deadline, setDeadline] = useState(project?.deadline?.slice(0, 10) ?? "");
  const selectedClientName = clients.find((client) => String(client.id) === clientId)?.name;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={project ? <Button variant="outline" size="sm">Edit</Button> : <Button className="gap-2"><Plus className="size-4" /> New Project</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Tambah Project"}</DialogTitle>
          <DialogDescription>{project ? "Update data project." : "Buat project baru dari operasional."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Client</Label><Select value={clientId} onValueChange={(value) => setClientId(value ?? "")}><SelectTrigger className="w-full"><TriggerLabel text={selectedClientName} placeholder="Pilih client" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>Project Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Contract Value</Label><RupiahInput value={value} onChange={setValue} placeholder="120.000.000" /></div>
          <div className="grid gap-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value ?? "In Progress")}><SelectTrigger className="w-full"><TriggerLabel text={status} placeholder="Pilih status" /></SelectTrigger><SelectContent><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="On Hold">On Hold</SelectItem></SelectContent></Select></div>
          <div className="grid gap-2"><Label>Progress (%)</Label><Input type="number" value={progress} onChange={(e) => setProgress(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Deadline</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button disabled={loading || !clientId || !name} onClick={async () => {
            try {
              setLoading(true);
              await send(project ? `/api/projects/${project.id}` : "/api/projects", project ? "PATCH" : "POST", { clientId, name, value, status, progress, deadline });
              toast.success(project ? "Project diupdate" : "Project ditambahkan");
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal simpan project");
            } finally {
              setLoading(false);
            }
          }}>{loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function QuotationDialog({ clients, projects, quotation }: { clients: ClientOption[]; projects: ProjectOption[]; quotation?: QuotationRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(quotation ? String(quotation.clientId) : "");
  const [projectId, setProjectId] = useState(quotation?.projectId ? String(quotation.projectId) : "none");
  const [status, setStatus] = useState(quotation?.status ?? "Draft");
  const [paymentMethod, setPaymentMethod] = useState(quotation?.paymentMethod ?? "CBD");
  const [validUntil, setValidUntil] = useState(quotation?.validUntil?.slice(0, 10) ?? "");
  const [attachment, setAttachment] = useState(quotation?.attachment ?? "-");
  const [subject, setSubject] = useState(quotation?.subject ?? "Surat Penawaran");
  const [recipientName, setRecipientName] = useState(quotation?.recipientName ?? "");
  const [recipientCompany, setRecipientCompany] = useState(quotation?.recipientCompany ?? "");
  const [recipientAddress, setRecipientAddress] = useState(quotation?.recipientAddress ?? "Di tempat");
  const [introduction, setIntroduction] = useState(quotation?.introduction ?? "Perkenalkan kami PT. Manggala Utama Indonesia adalah perusahaan berfokus pada bidang Teknologi Informasi, Pembuatan/Pengembangan Software, serta infrastruktur TI.");
  const [terms, setTerms] = useState(quotation?.terms ?? "Harga belum termasuk PPN 11%\nPenawaran berlaku selama 7 hari\nPayment 30 Hari Setelah Invoice Terbit");
  const [closingNote, setClosingNote] = useState(quotation?.closingNote ?? "Demikian surat penawaran ini kami sampaikan. Besar harapan kami untuk dapat bekerjasama dengan bapak/ibu dalam proyek ini.");
  const [signatoryName, setSignatoryName] = useState(quotation?.signatoryName ?? "Adiatma Pasau");
  const [signatoryTitle, setSignatoryTitle] = useState(quotation?.signatoryTitle ?? "Manager Marketing");
  const [taxPercent, setTaxPercent] = useState(quotation && quotation.subtotal > 0 ? String(Number(((quotation.tax / quotation.subtotal) * 100).toFixed(2))) : "11");
  const filteredProjects = projects.filter((project) => !clientId || String(project.clientId ?? "") === clientId);
  const selectedClientName = clients.find((client) => String(client.id) === clientId)?.name;
  const selectedProjectName = projectId === "none" ? "Tanpa project" : filteredProjects.find((project) => String(project.id) === projectId)?.name;
  const [items, setItems] = useState<Array<{ description: string; qty: string; unit: string; unitPrice: string; unitCost: string; imageUrl?: string; includeImage?: boolean; uploading?: boolean }>>(
    quotation?.items?.length ? quotation.items.map((item) => ({ description: item.description, qty: String(item.qty), unit: item.unit || "Unit", unitPrice: String(item.unitPrice), unitCost: String((item as any).unitCost ?? 0), imageUrl: item.imageUrl ?? undefined, includeImage: !!item.imageUrl })) : [{ description: "", qty: "1", unit: "Unit", unitPrice: "", unitCost: "", includeImage: false }],
  );
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false);

  useEffect(() => {
    if (!open || quotation) return;
    let active = true;
    fetch("/api/settings").then((response) => response.ok ? response.json() : null).then((settings) => {
      if (!active || !settings) return;
      setPaymentMethod(String(settings.defaultPaymentMethod ?? "CBD"));
      setTaxPercent(String(settings.defaultTaxPercent ?? 11));
      setAttachment("-");
      setSubject("Surat Penawaran");
      setRecipientAddress(String(settings.companyAddress ?? "Di tempat") || "Di tempat");
      setIntroduction(`Perkenalkan kami ${settings.companyName ?? "PT. Manggala Utama Indonesia"} adalah perusahaan berfokus pada bidang Teknologi Informasi, Pembuatan/Pengembangan Software, serta infrastruktur TI.`);
      setTerms(`Harga belum termasuk PPN ${settings.defaultTaxPercent ?? 11}%\nPenawaran berlaku selama ${settings.quotationValidityDays ?? 7} hari\nPayment ${(settings.defaultPaymentMethod ?? "CBD") === "Term" ? "sesuai term invoice" : "CBD"}`);
      const nextValidUntil = new Date();
      nextValidUntil.setDate(nextValidUntil.getDate() + Number(settings.quotationValidityDays ?? 7));
      setValidUntil(nextValidUntil.toISOString().slice(0, 10));
    }).catch(() => null);
    return () => { active = false; };
  }, [open, quotation]);

  const normalizedTaxPercent = useMemo(() => {
    const raw = Number(String(taxPercent).replace(",", "."));
    if (!Number.isFinite(raw) || raw < 0) return 0;
    return raw;
  }, [taxPercent]);
  const taxMultiplier = useMemo(() => pricesIncludeTax ? (1 + (normalizedTaxPercent / 100)) : 1, [pricesIncludeTax, normalizedTaxPercent]);

  const computedItems = useMemo(() => items.map((item) => {
    const rawPrice = parseMoneyInput(item.unitPrice);
    const rawCost = parseMoneyInput(item.unitCost ?? 0);
    const priceDpp = rawPrice / taxMultiplier;
    const costDpp = rawCost / taxMultiplier;
    return {
      ...item,
      priceDpp,
      costDpp,
      amount: priceDpp * Number(item.qty || 0)
    };
  }), [items, taxMultiplier]);
  
  const subtotal = useMemo(() => computedItems.reduce((sum, item) => sum + item.amount, 0), [computedItems]);
  const totalCost = useMemo(() => computedItems.reduce((sum, item) => sum + (item.costDpp * Number(item.qty || 0)), 0), [computedItems]);
  const taxAmount = useMemo(() => Math.round((subtotal * normalizedTaxPercent) / 100), [subtotal, normalizedTaxPercent]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={quotation ? <Button variant="outline" size="sm">Edit</Button> : <Button className="gap-2"><Plus className="size-4" /> Create Quotation</Button>} />
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quotation ? "Edit Quotation" : "Tambah Quotation"}</DialogTitle>
          <DialogDescription>{quotation ? "Update quotation existing." : "Buat surat penawaran lengkap dengan item barang/jasa, term, dan metadata surat."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2"><Label>Client</Label><Select value={clientId} onValueChange={(value) => { setClientId(value ?? ""); setProjectId("none"); }}><SelectTrigger className="w-full"><TriggerLabel text={selectedClientName} placeholder="Pilih client" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Project (opsional)</Label><Select value={projectId} onValueChange={(value) => setProjectId(value ?? "none")}><SelectTrigger className="w-full"><TriggerLabel text={selectedProjectName} placeholder="Pilih project" /></SelectTrigger><SelectContent><SelectItem value="none">Tanpa project</SelectItem>{filteredProjects.map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.name}{project.clientName ? ` — ${project.clientName}` : ""}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Payment Method</Label><Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value ?? "CBD")}><SelectTrigger className="w-full"><TriggerLabel text={paymentMethod} placeholder="Pilih opsi" /></SelectTrigger><SelectContent><SelectItem value="CBD">CBD</SelectItem><SelectItem value="Term">Term</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value ?? "Draft")}><SelectTrigger className="w-full"><TriggerLabel text={status} placeholder="Pilih opsi" /></SelectTrigger><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Sent">Sent</SelectItem><SelectItem value="Accepted">Accepted</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Valid Until</Label><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Pajak (%)</Label><Input type="number" min="0" step="0.01" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} placeholder="11" /></div>
          </div>

          <div className="rounded-xl border p-4 space-y-4"><h3 className="font-semibold">Metadata Surat Penawaran</h3><div className="grid gap-4 md:grid-cols-2"><div className="grid gap-2"><Label>Lampiran</Label><Input value={attachment} onChange={(e) => setAttachment(e.target.value)} placeholder="-" /></div><div className="grid gap-2"><Label>Perihal</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Surat Penawaran Smart TV" /></div><div className="grid gap-2"><Label>Kepada Yth.</Label><Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Bapak Guntur Ayatulloh" /></div><div className="grid gap-2"><Label>Perusahaan Penerima</Label><Input value={recipientCompany} onChange={(e) => setRecipientCompany(e.target.value)} placeholder="PT. Prasad" /></div><div className="grid gap-2 md:col-span-2"><Label>Alamat Penerima</Label><Input value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="Di tempat" /></div><div className="grid gap-2 md:col-span-2"><Label>Pembuka Surat</Label><Textarea rows={4} value={introduction} onChange={(e) => setIntroduction(e.target.value)} /></div></div></div>

          <div className="rounded-xl border p-4 space-y-4"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Item Quotation</h3><label className="flex items-center gap-2 mt-1 cursor-pointer"><input type="checkbox" className="rounded w-4 h-4 cursor-pointer" checked={pricesIncludeTax} onChange={(e) => setPricesIncludeTax(e.target.checked)} /><span className="text-sm text-muted-foreground font-medium">Input Harga & Modal sudah termasuk PPN</span></label></div><Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { description: "", qty: "1", unit: "Unit", unitPrice: "", unitCost: "", includeImage: false }])}>Tambah Item</Button></div><div className="grid gap-3">{computedItems.map((item, index) => (<div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-12"><div className="md:col-span-4"><Label>Nama Barang/Jasa + Spesifikasi</Label><Textarea rows={4} value={item.description} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, description: e.target.value } : row))} placeholder="Contoh: SAMSUNG 75 inch 4K Smart TV\nSpesifikasi: ..." /></div><div className="md:col-span-1"><Label>Qty</Label><Input type="number" value={item.qty} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, qty: e.target.value } : row))} /></div><div className="md:col-span-1"><Label>Unit</Label><Input value={item.unit} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, unit: e.target.value } : row))} placeholder="Unit / Pcs / Set" /></div><div className="md:col-span-2"><Label>Harga Jual</Label><RupiahInput value={item.unitPrice} onChange={(value) => setItems(items.map((row, i) => i === index ? { ...row, unitPrice: value } : row))} placeholder="5000000" /></div><div className="md:col-span-2"><Label>Modal (Cost)</Label><RupiahInput value={item.unitCost} onChange={(value) => setItems(items.map((row, i) => i === index ? { ...row, unitCost: value } : row))} placeholder="4000000" /></div><div className="md:col-span-2"><Label>Margin Item</Label><div className={cn("text-sm font-medium p-2 rounded border", ((item.priceDpp - item.costDpp) * Number(item.qty || 0)) >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700")}><span className="block">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format((item.priceDpp - item.costDpp) * Number(item.qty || 0))}</span><span className="text-xs ml-1 opacity-70">{(((item.priceDpp - item.costDpp) / (item.priceDpp || 1)) * 100).toFixed(1)}%</span></div></div><div className="md:col-span-12 space-y-2 mt-2 pt-2 border-t"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded w-4 h-4" checked={item.includeImage || false} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, includeImage: e.target.checked } : row))} /><span className="text-sm font-medium">Sertakan Gambar (Lampiran)</span></label>{item.includeImage && (<div className="flex items-center gap-3"><Input type="file" accept="image/*" disabled={item.uploading} className="max-w-xs" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setItems(items.map((r, i) => i === index ? { ...r, uploading: true } : r)); const fd = new FormData(); fd.append("file", f); try { const res = await fetch("/api/upload", { method: "POST", body: fd }); if (res.ok) { const d = await res.json(); setItems(items.map((r, i) => i === index ? { ...r, imageUrl: d.url, uploading: false } : r)); } else { throw new Error(); } } catch (err) { toast.error("Upload gagal"); setItems(items.map((r, i) => i === index ? { ...r, uploading: false } : r)); } }} />{item.uploading ? <Loader2 className="size-4 animate-spin" /> : (item.imageUrl && item.includeImage) ? <span className="text-sm text-green-600">Terupload</span> : null}</div>)}</div><div className="md:col-span-12 flex justify-end"><Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setItems(items.length === 1 ? items : items.filter((_, i) => i !== index))}>Hapus Item</Button></div></div>))}</div><div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal (Penjualan)</span><span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(subtotal)}</span></div><div className="flex justify-between text-orange-600 font-medium"><span>Total Modal (Cost)</span><span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalCost)}</span></div><div className={cn("flex justify-between font-semibold", (subtotal - totalCost) >= 0 ? "text-green-600" : "text-red-600")}><span>Total Margin</span><span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(subtotal - totalCost)} ({((subtotal - totalCost) / (subtotal || 1) * 100).toFixed(1)}%)</span></div><div className="flex justify-between"><span>PPN ({normalizedTaxPercent}%)</span><span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(taxAmount)}</span></div><div className="flex justify-between font-semibold text-base border-t pt-2 mt-2"><span>Total (Termasuk PPN)</span><span>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(total)}</span></div></div></div>

          <div className="rounded-xl border p-4 space-y-4"><h3 className="font-semibold">Syarat Penawaran & Penutup</h3><div className="grid gap-4 md:grid-cols-2"><div className="grid gap-2 md:col-span-2"><Label>Term & Kondisi</Label><Textarea rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} /></div><div className="grid gap-2 md:col-span-2"><Label>Catatan Penutup</Label><Textarea rows={4} value={closingNote} onChange={(e) => setClosingNote(e.target.value)} /></div><div className="grid gap-2"><Label>Nama Penanda Tangan</Label><Input value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} /></div><div className="grid gap-2"><Label>Jabatan Penanda Tangan</Label><Input value={signatoryTitle} onChange={(e) => setSignatoryTitle(e.target.value)} /></div></div></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button disabled={loading || !clientId || total <= 0 || computedItems.some((item) => !item.description || item.amount <= 0)} onClick={async () => {
            try {
              setLoading(true);
              await send(quotation ? `/api/quotations/${quotation.id}` : "/api/quotations", quotation ? "PATCH" : "POST", { clientId, projectId: projectId === "none" ? null : projectId, taxPercent: normalizedTaxPercent, status, paymentMethod, validUntil, attachment, subject, recipientName, recipientCompany, recipientAddress, introduction, terms, closingNote, signatoryName, signatoryTitle, items: computedItems.map((item) => ({ description: item.description, qty: Number(item.qty || 0), unit: item.unit || "Unit", unitPrice: item.priceDpp, unitCost: item.costDpp, amount: item.amount, imageUrl: item.includeImage ? item.imageUrl : null })) });
              toast.success(quotation ? "Quotation diupdate" : "Quotation dibuat");
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal simpan quotation");
            } finally {
              setLoading(false);
            }
          }}>{loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan Quotation"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
