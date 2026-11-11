"use client";

import { useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { tampilkanBerkas } from "@/lib/dokumen-pdf";

// Unggah foto/PDF nota lewat /api/upload yang udah ada. Nilai = URL file (/api/uploads/...).
export function UnggahNota({ value, onChange, wajib }: { value: string; onChange: (url: string) => void; wajib?: boolean }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-slate-50">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
          {value ? "Ganti nota" : "Pilih foto / PDF nota"}
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={loading}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setLoading(true);
              try {
                const fd = new FormData();
                fd.append("file", f);
                const res = await fetch("/api/upload", { method: "POST", body: fd });
                const d = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(d.error ?? "Unggah nota gagal");
                onChange(d.url);
                toast.success("Nota keunggah");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Unggah nota gagal");
              } finally {
                setLoading(false);
              }
            }}
          />
        </label>
        {value ? (
          <button type="button" className="text-sm font-medium text-primary underline" onClick={() => tampilkanBerkas(value, `Nota${value.slice(value.lastIndexOf("."))}`)}>
            Lihat nota
          </button>
        ) : (
          <span className={wajib ? "text-sm text-rose-600" : "text-sm text-muted-foreground"}>{wajib ? "Nota wajib diunggah" : "Belum ada nota"}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, atau PDF, maks 8 MB.</p>
    </div>
  );
}
