"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DetailDialog, formatCurrency, formatDateSafe } from "@/components/forms/entity-detail-dialogs";
import { MoneyInput } from "@/components/forms/money-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export function LeadRowActions({ row, clients }: { row: LeadRow; clients: ClientOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(String(row.clientId));
  const [serviceName, setServiceName] = useState(row.serviceName);
  const [estimatedValue, setEstimatedValue] = useState(String(row.estimatedValue));
  const [status, setStatus] = useState(row.status);

  const handleSave = async () => {
    try {
      await requestJson(`/api/leads/${row.id}`, "PATCH", { clientId, serviceName, estimatedValue, status });
      toast.success("Lead diupdate");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal update lead");
    }
  };

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

  return (
    <div className="flex justify-end gap-2">
      <DetailDialog
        title={`Detail ${row.code}`}
        description="Ringkasan lengkap data lead"
        rows={[
          { label: "Lead ID", value: row.code },
          { label: "Client", value: row.clientName },
          { label: "Contact", value: row.contactPerson ?? "-" },
          { label: "Phone", value: row.phone ?? "-" },
          { label: "Service", value: row.serviceName },
          { label: "Estimated Value", value: formatCurrency(row.estimatedValue) },
          { label: "Status", value: row.status },
          { label: "Created", value: formatDateSafe(row.createdAt) },
        ]}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm"><Pencil className="size-4" /> Edit</Button>} />
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Perbarui data lead yang sudah ada.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2"><Label>Client</Label><Select value={clientId} onValueChange={(value) => setClientId(value ?? "")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih client" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Service Need</Label><Input value={serviceName} onChange={(event) => setServiceName(event.target.value)} /></div>
            <div className="grid gap-2"><Label>Estimated Value</Label><MoneyInput value={estimatedValue} onChange={setEstimatedValue} placeholder="111.000.000" /></div>
            <div className="grid gap-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value ?? "New")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih opsi" /></SelectTrigger><SelectContent>{["New", "Follow Up", "Negotiation", "Won", "Lost"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button variant="outline" size="sm" className="text-destructive" onClick={handleDelete}><Trash2 className="size-4" /> Delete</Button>
    </div>
  );
}
