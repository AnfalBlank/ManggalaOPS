import { Check, Circle, CircleDashed, Minus } from "lucide-react";

import type { Tahap } from "@/lib/po";

const gaya: Record<Tahap["keadaan"], { kelas: string; ikon: typeof Check }> = {
  beres: { kelas: "bg-emerald-50 text-emerald-700 border-emerald-200", ikon: Check },
  jalan: { kelas: "bg-amber-50 text-amber-800 border-amber-200", ikon: CircleDashed },
  belum: { kelas: "bg-white text-slate-500 border-slate-200", ikon: Circle },
  lewat: { kelas: "bg-slate-50 text-slate-400 border-slate-200", ikon: Minus },
};

// Deretan tahap satu PO: PO klien → PO supplier → surat jalan → tagihan → pembayaran.
export function DeretTahap({ tahap, ringkas = false }: { tahap: Tahap[]; ringkas?: boolean }) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {tahap.map((t) => {
        const g = gaya[t.keadaan];
        const Ikon = g.ikon;
        return (
          <li key={t.kunci} title={`${t.label}: ${t.keterangan}`} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${g.kelas}`}>
            <Ikon className="size-3" />
            {t.label}
            {ringkas ? null : <span className="font-normal opacity-80">· {t.keterangan}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export function LabelPosisi({ posisi, selesai }: { posisi: string; selesai: boolean }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${selesai ? "bg-emerald-100 text-emerald-800" : "bg-blue-50 text-blue-800"}`}>
      {posisi}
    </span>
  );
}
