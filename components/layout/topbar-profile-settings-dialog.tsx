"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TopbarProfileSettingsDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (open: boolean) => void; user?: { name: string; email: string; role: string; avatarUrl?: string | null } }) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [password, setPassword] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>Ubah profil user, foto avatar, email, dan password login.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Nama</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Avatar URL / Data URL</Label><Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://... atau data:image/..." /></div>
          <div className="grid gap-2"><Label>Password Baru</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kosongkan jika tidak ganti" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={async () => {
            const response = await fetch('/api/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, avatarUrl, password }),
            });
            const payload = await response.json();
            if (!response.ok) {
              toast.error(payload.error ?? 'Gagal update profile');
              return;
            }
            toast.success('Profile berhasil diupdate');
            setPassword('');
            onOpenChange(false);
            window.location.reload();
          }}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
