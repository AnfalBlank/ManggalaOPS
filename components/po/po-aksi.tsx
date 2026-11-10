"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buatPoSupplierPdf, type Kop } from "@/lib/dokumen-pdf";
import type { PoSupplier } from "@/lib/po";

export type KopTtd = Kop & { defaultSignatoryName?: string | null; defaultSignatoryTitle?: string | null };

async function kirim(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Gagal");
  return data;
}

function useAksi() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const jalan = async (fn: () => Promise<unknown>, pesan: string) => {
    setLoading(true);
    try {
      await fn();
      toast.success(pesan);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  };
  return { loading, jalan };
}

export function LihatPoSupplier({ sup, kop }: { sup: PoSupplier; kop: KopTtd }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={() =>
        buatPoSupplierPdf(
          {
            ...sup,
            date: sup.date ? new Date(sup.date) : new Date(),
            expectedDate: sup.expectedDate ? new Date(sup.expectedDate) : null,
            signatoryName: kop.defaultSignatoryName,
            signatoryTitle: kop.defaultSignatoryTitle,
          },
          kop,
        )
      }
    >
      <Eye className="size-4" /> Lihat PDF
    </Button>
  );
}

function PilihStatus({ nilai, pilihan, onUbah, disabled }: { nilai: string; pilihan: readonly string[]; onUbah: (s: string) => void; disabled?: boolean }) {
  return (
    <select
      aria-label="Status"
      className="h-8 rounded-md border bg-white px-2 text-sm"
      value={nilai}
      disabled={disabled}
      onChange={(e) => onUbah(e.target.value)}
    >
      {pilihan.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}

export function AksiPoSupplier({ id, status }: { id: number; status: string }) {
  const { loading, jalan } = useAksi();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PilihStatus
        nilai={status}
        pilihan={["Draft", "Dikirim ke supplier", "Barang diterima", "Batal"]}
        disabled={loading}
        onUbah={(s) => jalan(() => kirim(`/api/po-supplier/${id}`, "PATCH", { status: s }), "Status PO supplier diubah")}
      />
      {status === "Draft" ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-rose-600"
          aria-label="Hapus PO supplier"
          disabled={loading}
          onClick={() => {
            if (confirm("Hapus PO supplier ini?")) jalan(() => kirim(`/api/po-supplier/${id}`, "DELETE"), "PO supplier dihapus");
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

export function AksiPo({ id, ditutup, bisaDihapus }: { id: number; ditutup: boolean; bisaDihapus: boolean }) {
  const router = useRouter();
  const { loading, jalan } = useAksi();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => {
          const pesan = ditutup ? "Buka lagi PO ini?" : "Tutup PO ini? PO yang ditutup dianggap selesai walau ada tahap yang belum beres.";
          if (confirm(pesan)) jalan(() => kirim(`/api/po/${id}`, "PATCH", { closed: !ditutup }), ditutup ? "PO dibuka lagi" : "PO ditutup");
        }}
      >
        {ditutup ? "Buka lagi" : "Tutup PO"}
      </Button>
      {bisaDihapus ? (
        <Button
          variant="ghost"
          className="text-rose-600"
          disabled={loading}
          onClick={async () => {
            if (!confirm("Hapus PO ini? Penawarannya tetap berstatus diterima.")) return;
            try {
              await kirim(`/api/po/${id}`, "DELETE");
              toast.success("PO dihapus");
              router.push("/po");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Gagal");
            }
          }}
        >
          Hapus PO
        </Button>
      ) : null}
    </div>
  );
}
