"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSignature, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DetailDialog, formatCurrency, formatDateSafe } from "@/components/forms/entity-detail-dialogs";
import { MoneyInput } from "@/components/forms/money-input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labelStatus } from "@/lib/label-status";

type ClientOption = { id: number; name: string };
type LeadRow = {
  id: number;
  code: string;
  clientId: number;
  clientName: string;
  contactPerson: string | null;
  phone: string | null;
  serviceName: string;
  estimatedValue: number;
  status: string;
  createdAt: string | null;
};

async function requestJson(url: string, method: "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "Gagal nyimpen ke server");
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

  const handleSave = async () => {
    try {
      await requestJson(`/api/leads/${row.id}`, "PATCH", { clientId, serviceName, estimatedValue, status });
      toast.success("Calon klien disimpan");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal nyimpen calon klien");
    }
  };

  const handleDelete = async () => {
    try {
      await requestJson(`/api/leads/${row.id}`, "DELETE");
      toast.success("Calon klien dihapus");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal hapus calon klien");
    }
  };

  const [converting, setConverting] = useState(false);
  const handleConvert = async () => {
    try {
      setConverting(true);
      const result = await requestJson(`/api/leads/${row.id}/convert-to-quotation`, "POST");
      toast.success(`Draf penawaran #${result.quotationId} dibuat. Lengkapi detailnya di halaman Penawaran.`);
      router.push("/quotations");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal bikin penawaran");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <DetailDialog
        title={`Detail ${row.code}`}
        description="Ringkasan data calon klien"
        rows={[
          { label: "No.", value: row.code },
          { label: "Klien", value: row.clientName },
          { label: "Kontak", value: row.contactPerson ?? "-" },
          { label: "No. HP", value: row.phone ?? "-" },
          { label: "Kebutuhan", value: row.serviceName },
          { label: "Perkiraan nilai", value: formatCurrency(row.estimatedValue) },
          { label: "Status", value: labelStatus(row.status) },
          { label: "Dibuat", value: formatDateSafe(row.createdAt) },
        ]}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm"><Pencil className="size-4" /> Ubah</Button>} />
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ubah calon klien</DialogTitle>
            <DialogDescription>Perbarui data calon klien ini.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2"><Label>Klien</Label><Select value={clientId} onValueChange={(value) => setClientId(value ?? "")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih klien">{selectedClientName}</SelectValue></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Kebutuhan</Label><Input value={serviceName} onChange={(event) => setServiceName(event.target.value)} /></div>
            <div className="grid gap-2"><Label>Perkiraan nilai</Label><MoneyInput value={estimatedValue} onChange={setEstimatedValue} placeholder="111.000.000" /></div>
            <div className="grid gap-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value ?? "New")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status">{(v: string) => labelStatus(v)}</SelectValue></SelectTrigger><SelectContent>{["New", "Follow Up", "Negotiation", "Won", "Lost"].map((item) => <SelectItem key={item} value={item}>{labelStatus(item)}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button
        variant="outline"
        size="sm"
        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
        disabled={converting || row.status === "Lost"}
        onClick={handleConvert}
        title="Bikin draf penawaran dari calon klien ini"
      >
        <FileSignature className="size-4" /> {converting ? "Memproses..." : "Bikin penawaran"}
      </Button>
      <ConfirmDialog
        trigger={<Button variant="outline" size="sm" className="text-destructive"><Trash2 className="size-4" /> Hapus</Button>}
        title={`Hapus calon klien "${row.serviceName}"?`}
        description="Calon klien ini dihapus permanen. Kalau udah dipakai di proyek, gak bisa dihapus."
        confirmText="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
