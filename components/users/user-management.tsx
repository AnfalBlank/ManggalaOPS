"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { DetailDialog, formatDateSafe } from "@/components/forms/entity-detail-dialogs";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableFilterBar } from "@/components/filters/table-filter-bar";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string | Date | null;
};

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "finance", label: "Keuangan" },
  { value: "sales", label: "Sales" },
  { value: "project_manager", label: "Manajer proyek" },
];

async function send(url: string, method: string, body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "Gagal nyimpen ke server");
  return payload;
}

function UserDialog({ user }: { user?: UserRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? "sales");
  const [password, setPassword] = useState("");

  const isCreate = !user;
  const passwordTooShort = password.length > 0 && password.length < 8;
  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && (!isCreate || password.length >= 8) && !passwordTooShort;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={isCreate ? <Button className="gap-2"><Plus className="size-4" /> Tambah pengguna</Button> : <Button variant="outline" size="sm">Ubah</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Tambah pengguna" : "Ubah pengguna"}</DialogTitle>
          <DialogDescription>{isCreate ? "Bikin akun baru buat anggota tim." : "Ubah nama, email, jabatan, atau ganti password."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Nama</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Jabatan</Label><Select value={role} onValueChange={(value) => setRole(value ?? "sales")}><SelectTrigger className="w-full"><SelectValue>{(v: string) => roleOptions.find((r) => r.value === v)?.label ?? v}</SelectValue></SelectTrigger><SelectContent>{roleOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2">
            <Label>{isCreate ? "Password" : "Password baru (boleh kosong)"}</Label>
            <Input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isCreate ? "Minimal 8 karakter" : "Kosongin kalau gak diganti"}
              className={passwordTooShort ? "border-rose-300 focus-visible:ring-rose-200" : ""}
            />
            {passwordTooShort ? (
              <p className="text-xs text-rose-600">Password minimal 8 karakter.</p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button disabled={loading || !canSubmit} onClick={async () => {
            try {
              setLoading(true);
              await send(isCreate ? "/api/users" : `/api/users/${user.id}`, isCreate ? "POST" : "PATCH", { name, email, role, password: password || undefined });
              toast.success(isCreate ? "Pengguna ditambahkan" : "Data pengguna disimpan");
              setPassword("");
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal nyimpen pengguna");
            } finally {
              setLoading(false);
            }
          }}>{loading ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UserManagement({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.role} ${roleOptions.find((r) => r.value === user.role)?.label ?? ""}`.toLowerCase().includes(query.toLowerCase())), [users, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <TableFilterBar value={query} onChange={setQuery} placeholder="Cari pengguna..." />
        <UserDialog />
      </div>
      <div className="w-full overflow-x-auto md:rounded-xl md:border md:bg-white">
        <Table className="min-w-[760px] xl:min-w-0">
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{roleOptions.find((item) => item.value === user.role)?.label ?? user.role}</TableCell>
                <TableCell>{formatDateSafe(user.createdAt ? String(user.createdAt) : null)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <DetailDialog
                      title={`Detail pengguna #${user.id}`}
                      description="Ringkasan data pengguna"
                      rows={[
                        { label: "Nama", value: user.name },
                        { label: "Email", value: user.email },
                        { label: "Jabatan", value: roleOptions.find((item) => item.value === user.role)?.label ?? user.role },
                        { label: "Dibuat", value: formatDateSafe(String(user.createdAt)) },
                      ]}
                    />
                    <UserDialog user={user} />
                    <ConfirmDialog
                      trigger={<Button variant="outline" size="sm" className="text-destructive">Hapus</Button>}
                      title={`Hapus pengguna ${user.email}?`}
                      description="Akun ini dihapus dan langsung keluar dari semua perangkat."
                      confirmText="Hapus"
                      variant="destructive"
                      onConfirm={async () => {
                        try {
                          await send(`/api/users/${user.id}`, "DELETE");
                          toast.success("Pengguna dihapus");
                          router.refresh();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Gagal hapus pengguna");
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
    </div>
  );
}
