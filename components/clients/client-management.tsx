"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ClientRow = {
  id: number;
  name: string;
  contactPerson?: string | null;
  additionalPic?: string | null;
  phone?: string | null;
  email?: string | null;
  npwp?: string | null;
  address?: string | null;
  notes?: string | null;
};

async function requestJson(url: string, method: "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload;
}

function ClientDialog({ client }: { client?: ClientRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(client?.name ?? "");
  const [contactPerson, setContactPerson] = useState(client?.contactPerson ?? "");
  const [additionalPic, setAdditionalPic] = useState(client?.additionalPic ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [npwp, setNpwp] = useState(client?.npwp ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={client ? "outline" : "default"} size="sm">{client ? <><Pencil className="size-4" /> Edit</> : <><Plus className="size-4" /> Add Client</>}</Button>} />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Tambah Client Baru"}</DialogTitle>
          <DialogDescription>Lengkapi data client untuk dipakai di lead, quotation, invoice, dan project.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2"><Label>Nama Client / Perusahaan</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Contact Person</Label><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></div>
          <div className="grid gap-2"><Label>PIC Tambahan</Label><Input value={additionalPic} onChange={(e) => setAdditionalPic(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-2"><Label>NPWP</Label><Input value={npwp} onChange={(e) => setNpwp(e.target.value)} /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={async () => {
            try {
              const payload = { name, contactPerson, additionalPic, phone, email, npwp, address, notes };
              if (client) {
                await requestJson(`/api/clients/${client.id}`, "PATCH", payload);
                toast.success("Client diupdate");
              } else {
                await requestJson(`/api/clients`, "POST", payload);
                toast.success("Client ditambahkan");
              }
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal simpan client");
            }
          }} disabled={!name.trim()}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClientManagement({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => clients.filter((client) => `${client.name} ${client.contactPerson ?? ""} ${client.additionalPic ?? ""} ${client.phone ?? ""} ${client.email ?? ""} ${client.npwp ?? ""}`.toLowerCase().includes(query.toLowerCase())), [clients, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <TableFilterBar value={query} onChange={setQuery} placeholder="Search clients..." />
        <ClientDialog />
      </div>

      <div className="w-full overflow-x-auto rounded-xl border bg-white">
        <Table className="min-w-[1240px]">
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>PIC Tambahan</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>NPWP</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.contactPerson ?? "-"}</TableCell>
                <TableCell>{client.additionalPic ?? "-"}</TableCell>
                <TableCell>{client.phone ?? "-"}</TableCell>
                <TableCell>{client.email ?? "-"}</TableCell>
                <TableCell>{client.npwp ?? "-"}</TableCell>
                <TableCell className="max-w-[220px] truncate" title={client.address ?? undefined}>{client.address ?? "-"}</TableCell>
                <TableCell className="max-w-[220px] truncate" title={client.notes ?? undefined}>{client.notes ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <ClientDialog client={client} />
                    <Button variant="outline" size="sm" className="text-destructive" onClick={async () => {
                      if (!confirm(`Hapus client ${client.name}?`)) return;
                      try {
                        await requestJson(`/api/clients/${client.id}`, "DELETE");
                        toast.success("Client dihapus");
                        router.refresh();
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Gagal hapus client");
                      }
                    }}><Trash2 className="size-4" /> Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
