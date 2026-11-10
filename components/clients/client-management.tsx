"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, paginate } from "@/components/ui/pagination";
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
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "Gagal nyimpen ke server");
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
      <DialogTrigger render={<Button variant={client ? "outline" : "default"} size="sm">{client ? <><Pencil className="size-4" /> Ubah</> : <><Plus className="size-4" /> Tambah klien</>}</Button>} />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Ubah data klien" : "Tambah klien baru"}</DialogTitle>
          <DialogDescription>Data ini dipakai di calon klien, penawaran, proyek, dan tagihan.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2"><Label>Nama klien / perusahaan</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Nama kontak</Label><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></div>
          <div className="grid gap-2"><Label>PIC tambahan</Label><Input value={additionalPic} onChange={(e) => setAdditionalPic(e.target.value)} /></div>
          <div className="grid gap-2"><Label>No. HP / telepon</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-2"><Label>NPWP</Label><Input value={npwp} onChange={(e) => setNpwp(e.target.value)} /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Alamat</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Catatan</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={async () => {
            try {
              const payload = { name, contactPerson, additionalPic, phone, email, npwp, address, notes };
              if (client) {
                await requestJson(`/api/clients/${client.id}`, "PATCH", payload);
                toast.success("Data klien disimpan");
              } else {
                await requestJson(`/api/clients`, "POST", payload);
                toast.success("Klien ditambahkan");
              }
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal nyimpen data klien");
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
  const [sortOrder, setSortOrder] = useState<"az" | "za" | "newest" | "oldest">("az");

  const filtered = useMemo(() => {
    const searched = clients.filter((client) =>
      `${client.name} ${client.contactPerson ?? ""} ${client.additionalPic ?? ""} ${client.phone ?? ""} ${client.email ?? ""} ${client.npwp ?? ""}`.toLowerCase().includes(query.toLowerCase())
    );
    return [...searched].sort((a, b) => {
      if (sortOrder === "az") return a.name.localeCompare(b.name, "id");
      if (sortOrder === "za") return b.name.localeCompare(a.name, "id");
      if (sortOrder === "newest") return b.id - a.id;
      return a.id - b.id;
    });
  }, [clients, query, sortOrder]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => { setPage(1); }, [query, sortOrder, pageSize]);
  const paged = paginate(filtered, page, pageSize);

  const sortOptions = [
    { label: "A–Z", value: "az" },
    { label: "Z–A", value: "za" },
    { label: "Terbaru", value: "newest" },
    { label: "Terlama", value: "oldest" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <TableFilterBar value={query} onChange={setQuery} placeholder="Cari klien..." />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full sm:w-40"
          >
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <ClientDialog />
      </div>

      <div className="w-full overflow-x-auto md:rounded-xl md:border md:bg-white">
        <Table className="min-w-[1240px] xl:min-w-0">
          <TableHeader>
            <TableRow>
              <TableHead>Klien</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>PIC tambahan</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>NPWP</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((client) => (
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
                    <ConfirmDialog
                      trigger={<Button variant="outline" size="sm" className="text-destructive"><Trash2 className="size-4" /> Hapus</Button>}
                      title={`Hapus klien "${client.name}"?`}
                      description="Klien ini bakal dihapus. Kalau masih dipakai di calon klien, penawaran, tagihan, atau pembayaran, hapusnya gagal."
                      confirmText="Hapus"
                      variant="destructive"
                      onConfirm={async () => {
                        try {
                          await requestJson(`/api/clients/${client.id}`, "DELETE");
                          toast.success("Klien dihapus");
                          router.refresh();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Gagal hapus klien");
                        }
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}
