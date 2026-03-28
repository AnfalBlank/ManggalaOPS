"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { MoneyInput } from "@/components/forms/money-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";

type ClientOption = { id: number; name: string };
type ProjectOption = { id: number; name: string };

type ProjectRow = {
  id: number;
  clientId: number;
  name: string;
  value: number;
  status: string;
  progress: number;
  deadline: string | null;
};

type QuotationRow = {
  id: number;
  clientId: number;
  projectId: number | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  validUntil: string | null;
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={project ? <Button variant="outline" size="sm">Edit</Button> : <Button className="gap-2"><Plus className="size-4" /> New Project</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Tambah Project"}</DialogTitle>
          <DialogDescription>{project ? "Update data project." : "Buat project baru dari operasional."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Client</Label><Select value={clientId} onValueChange={(value) => setClientId(value ?? "")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih client" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>Project Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Contract Value</Label><MoneyInput value={value} onChange={setValue} placeholder="120.000.000" /></div>
          <div className="grid gap-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value ?? "In Progress")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="On Hold">On Hold</SelectItem></SelectContent></Select></div>
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
  const [subtotal, setSubtotal] = useState(quotation ? String(quotation.subtotal) : "");
  const [tax, setTax] = useState(quotation ? String(quotation.tax) : "");
  const [status, setStatus] = useState(quotation?.status ?? "Draft");
  const [validUntil, setValidUntil] = useState(quotation?.validUntil?.slice(0, 10) ?? "");
  const total = useMemo(() => parseMoneyInput(subtotal) + parseMoneyInput(tax), [subtotal, tax]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={quotation ? <Button variant="outline" size="sm">Edit</Button> : <Button className="gap-2"><Plus className="size-4" /> Create Quotation</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{quotation ? "Edit Quotation" : "Tambah Quotation"}</DialogTitle>
          <DialogDescription>{quotation ? "Update quotation existing." : "Buat quotation baru untuk client."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Client</Label><Select value={clientId} onValueChange={(value) => setClientId(value ?? "")}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih client" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>Project (opsional)</Label><Select value={projectId} onValueChange={(value) => setProjectId(value ?? "none")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Tanpa project</SelectItem>{projects.map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>Subtotal</Label><MoneyInput value={subtotal} onChange={setSubtotal} placeholder="950.000.000" /></div>
          <div className="grid gap-2"><Label>PPN</Label><MoneyInput value={tax} onChange={setTax} placeholder="104.500.000" /></div>
          <div className="grid gap-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value ?? "Draft")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Sent">Sent</SelectItem><SelectItem value="Accepted">Accepted</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent></Select></div>
          <div className="grid gap-2"><Label>Valid Until</Label><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">Total quotation: <span className="font-semibold">Rp {formatMoneyInput(total)}</span></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button disabled={loading || !clientId || total <= 0} onClick={async () => {
            try {
              setLoading(true);
              await send(quotation ? `/api/quotations/${quotation.id}` : "/api/quotations", quotation ? "PATCH" : "POST", { clientId, projectId: projectId === "none" ? null : projectId, subtotal, tax, total, status, validUntil });
              toast.success(quotation ? "Quotation diupdate" : "Quotation ditambahkan");
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal simpan quotation");
            } finally {
              setLoading(false);
            }
          }}>{loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
