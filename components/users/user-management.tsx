"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  { value: "finance", label: "Finance" },
  { value: "sales", label: "Sales" },
  { value: "project_manager", label: "Project Manager" },
];

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

function UserDialog({ user }: { user?: UserRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? "sales");
  const [password, setPassword] = useState("");

  const isCreate = !user;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={isCreate ? <Button className="gap-2"><Plus className="size-4" /> Add User</Button> : <Button variant="outline" size="sm">Edit</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Tambah User" : "Edit User"}</DialogTitle>
          <DialogDescription>{isCreate ? "Buat akun operasional baru." : "Update profil, role, atau reset password user."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Nama</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Role</Label><Select value={role} onValueChange={(value) => setRole(value ?? "sales")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{roleOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>{isCreate ? "Password" : "Reset Password (opsional)"}</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isCreate ? "Minimal isi password" : "Kosongkan jika tidak diubah"} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button disabled={loading || !name || !email || (isCreate && !password)} onClick={async () => {
            try {
              setLoading(true);
              await send(isCreate ? "/api/users" : `/api/users/${user.id}`, isCreate ? "POST" : "PATCH", { name, email, role, password: password || undefined });
              toast.success(isCreate ? "User ditambahkan" : "User diupdate");
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Gagal simpan user");
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
  const filtered = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase())), [users, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <TableFilterBar value={query} onChange={setQuery} placeholder="Search users..." />
        <UserDialog />
      </div>
      <div className="w-full overflow-x-auto rounded-xl border bg-white">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{roleOptions.find((item) => item.value === user.role)?.label ?? user.role}</TableCell>
                <TableCell>{user.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy") : "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <UserDialog user={user} />
                    <Button variant="outline" size="sm" className="text-destructive" onClick={async () => {
                      if (!confirm(`Hapus user ${user.email}?`)) return;
                      await send(`/api/users/${user.id}`, "DELETE");
                      toast.success("User dihapus");
                      router.refresh();
                    }}>Delete</Button>
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
