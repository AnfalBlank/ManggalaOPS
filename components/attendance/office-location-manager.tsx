"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number | null;
  isActive: boolean | null;
}

export function OfficeLocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState({ name: "", latitude: "", longitude: "", radius: "100" });

  const fetchLocations = async () => {
    const res = await fetch("/api/office-locations");
    setLocations(await res.json());
  };

  useEffect(() => { fetchLocations(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", latitude: "", longitude: "", radius: "100" });
    setOpen(true);
  };

  const openEdit = (loc: Location) => {
    setEditing(loc);
    setForm({
      name: loc.name,
      latitude: String(loc.latitude),
      longitude: String(loc.longitude),
      radius: String(loc.radiusMeters ?? 100),
    });
    setOpen(true);
  };

  const save = async () => {
    const payload = {
      name: form.name,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radiusMeters: Number(form.radius),
    };

    if (editing) {
      await fetch(`/api/office-locations/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/office-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setOpen(false);
    fetchLocations();
  };

  const remove = async (id: number) => {
    if (!confirm("Nonaktifkan lokasi ini?")) return;
    await fetch(`/api/office-locations/${id}`, { method: "DELETE" });
    fetchLocations();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <MapPin className="size-4" /> Lokasi Kantor
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button onClick={openNew} size="sm"><Plus className="size-4 mr-1" /> Tambah</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Lokasi" : "Tambah Lokasi Kantor"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nama Lokasi</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kantor Pusat" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Radius (meter)</Label>
                <Input type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: e.target.value })} />
              </div>
              <Button onClick={save} className="w-full" disabled={!form.name || !form.latitude || !form.longitude}>
                {editing ? "Simpan Perubahan" : "Tambah Lokasi"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Koordinat</TableHead>
              <TableHead>Radius</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell className="font-medium">{loc.name}</TableCell>
                <TableCell className="text-xs text-slate-500">{loc.latitude}, {loc.longitude}</TableCell>
                <TableCell>{loc.radiusMeters ?? 100}m</TableCell>
                <TableCell>
                  <Badge className={loc.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}>
                    {loc.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="size-8" onClick={() => openEdit(loc)}>
                      <Pencil className="size-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 text-red-500" onClick={() => remove(loc.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {locations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-4">Belum ada lokasi kantor</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
