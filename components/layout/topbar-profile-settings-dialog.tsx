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
          <DialogTitle>Profil saya</DialogTitle>
          <DialogDescription>Ubah nama, foto, email, dan password kamu.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Nama</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-2"><Label>Link foto profil</Label><Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://... atau data:image/..." /></div>
          <div className="grid gap-2"><Label>Password baru</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kosongin kalau gak diganti" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={async () => {
            const response = await fetch('/api/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, avatarUrl, password }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
              toast.error(payload.error ?? 'Gagal nyimpen profil');
              return;
            }
            toast.success('Profil disimpan');
            setPassword('');
            onOpenChange(false);
            window.location.reload();
          }}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
