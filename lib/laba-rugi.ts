// Untung/rugi per PO klien & per proyek. File ini murni hitungan (gak nyentuh database), dipakai di server & browser.
//
// Dasar hitung (biar gak dobel):
// - Pendapatan = tagihan yang TERBIT (tanggal tagihan), dihitung TANPA PPN (subtotal). PPN keluaran itu titipan pajak,
//   bukan pendapatan. Uang masuk (pembayaran) cuma info, TIDAK ditambah lagi ke pendapatan, karena pembayaran itu
//   pelunasan tagihan yang sama.
// - Belanja = pengeluaran (tanggal pengeluaran) yang nyambung ke PO/proyek, dihitung TANPA PPN (DPP). PPN masukan bisa
//   dikreditkan, jadi bukan biaya.
// - Untung kotor = pendapatan − belanja. Margin = untung ÷ pendapatan.
// - Per proyek: tagihan/pengeluaran pakai proyeknya sendiri; kalau kosong tapi punya PO, ikut proyek PO-nya. Jadi
//   pengeluaran lama yang cuma punya proyek tetap kehitung.

export type DataLaba = {
  tagihan: { id: number; date: string; clientPoId: number | null; projectId: number | null; subtotal: number; total: number }[];
  bayar: { invoiceId: number; date: string; amount: number }[];
  belanja: { id: number; date: string; clientPoId: number | null; projectId: number | null; dpp: number; total: number }[];
  po: { id: number; poNumber: string; clientName: string; projectId: number | null; nilai: number; nilaiDpp: number }[];
  proyek: { id: number; code: string; name: string; clientName: string }[];
};

export type BarisLaba = {
  id: number;
  nama: string;
  klien: string;
  nilaiPo: number | null;
  tagihanTotal: number;
  pendapatan: number;
  uangMasuk: number;
  belanjaTotal: number;
  belanja: number;
  jumlahBelanja: number;
  untung: number;
  margin: number | null;
};

const dalam = (iso: string, dari?: string | null, sampai?: string | null) => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (dari && t < new Date(`${dari}T00:00:00`).getTime()) return false;
  if (sampai && t > new Date(`${sampai}T23:59:59.999`).getTime()) return false;
  return true;
};

export const hitungMargin = (untung: number, pendapatan: number) => (pendapatan > 0 ? Math.round((untung / pendapatan) * 1000) / 10 : null);

function kosong(id: number, nama: string, klien: string, nilaiPo: number | null): BarisLaba {
  return { id, nama, klien, nilaiPo, tagihanTotal: 0, pendapatan: 0, uangMasuk: 0, belanjaTotal: 0, belanja: 0, jumlahBelanja: 0, untung: 0, margin: null };
}

export function hitungLaba(data: DataLaba, dari?: string | null, sampai?: string | null) {
  const poById = new Map(data.po.map((p) => [p.id, p]));
  const proyekTagihan = new Map<number, number | null>();
  const perPo = new Map<number, BarisLaba>();
  const perProyek = new Map<number, BarisLaba>();
  let belanjaTanpaProyek = 0;
  let jumlahTanpaProyek = 0;

  const ambilPo = (id: number) => {
    let b = perPo.get(id);
    if (!b) {
      const p = poById.get(id);
      b = kosong(id, p?.poNumber ?? `#${id}`, p?.clientName ?? "-", p?.nilai ?? null);
      perPo.set(id, b);
    }
    return b;
  };
  const proyekById = new Map(data.proyek.map((p) => [p.id, p]));
  const ambilProyek = (id: number) => {
    let b = perProyek.get(id);
    if (!b) {
      const p = proyekById.get(id);
      b = kosong(id, p ? `${p.code} · ${p.name}` : `Proyek #${id}`, p?.clientName ?? "-", null);
      perProyek.set(id, b);
    }
    return b;
  };

  for (const t of data.tagihan) {
    const proyekId = t.projectId ?? (t.clientPoId ? poById.get(t.clientPoId)?.projectId ?? null : null);
    proyekTagihan.set(t.id, proyekId);
    if (!dalam(t.date, dari, sampai)) continue;
    for (const b of [t.clientPoId ? ambilPo(t.clientPoId) : null, proyekId ? ambilProyek(proyekId) : null]) {
      if (!b) continue;
      b.tagihanTotal += t.total;
      b.pendapatan += t.subtotal;
    }
  }
  const tagihanById = new Map(data.tagihan.map((t) => [t.id, t]));
  for (const p of data.bayar) {
    if (!dalam(p.date, dari, sampai)) continue;
    const t = tagihanById.get(p.invoiceId);
    if (!t) continue;
    const proyekId = proyekTagihan.get(t.id) ?? null;
    if (t.clientPoId) ambilPo(t.clientPoId).uangMasuk += p.amount;
    if (proyekId) ambilProyek(proyekId).uangMasuk += p.amount;
  }
  for (const e of data.belanja) {
    if (!dalam(e.date, dari, sampai)) continue;
    const proyekId = e.projectId ?? (e.clientPoId ? poById.get(e.clientPoId)?.projectId ?? null : null);
    if (e.clientPoId) {
      const b = ambilPo(e.clientPoId);
      b.belanja += e.dpp;
      b.belanjaTotal += e.total;
      b.jumlahBelanja += 1;
    }
    if (proyekId) {
      const b = ambilProyek(proyekId);
      b.belanja += e.dpp;
      b.belanjaTotal += e.total;
      b.jumlahBelanja += 1;
    } else {
      belanjaTanpaProyek += e.dpp;
      jumlahTanpaProyek += 1;
    }
  }

  const selesai = (list: BarisLaba[]) =>
    list
      .map((b) => {
        const untung = b.pendapatan - b.belanja;
        return { ...b, untung, margin: hitungMargin(untung, b.pendapatan) };
      })
      .sort((a, b) => b.id - a.id);

  const po = selesai([...perPo.values()]);
  const proyek = selesai([...perProyek.values()]);
  const jumlah = (list: BarisLaba[]) => {
    const pendapatan = list.reduce((s, b) => s + b.pendapatan, 0);
    const belanja = list.reduce((s, b) => s + b.belanja, 0);
    return {
      tagihanTotal: list.reduce((s, b) => s + b.tagihanTotal, 0),
      pendapatan,
      uangMasuk: list.reduce((s, b) => s + b.uangMasuk, 0),
      belanja,
      untung: pendapatan - belanja,
      margin: hitungMargin(pendapatan - belanja, pendapatan),
    };
  };
  return { po, proyek, totalPo: jumlah(po), totalProyek: jumlah(proyek), belanjaTanpaProyek, jumlahTanpaProyek };
}

// Ringkasan 1 PO (tanpa filter periode) buat halaman detail PO.
export function labaSatuPo(data: DataLaba, poId: number) {
  const p = data.po.find((x) => x.id === poId);
  const baris = hitungLaba({ ...data, po: data.po.filter((x) => x.id === poId) }).po.find((b) => b.id === poId) ?? kosong(poId, p?.poNumber ?? "", p?.clientName ?? "", p?.nilai ?? null);
  const pakaiTagihan = baris.pendapatan > 0;
  const dasar = pakaiTagihan ? baris.pendapatan : (p?.nilaiDpp ?? 0);
  const untung = dasar - baris.belanja;
  return { ...baris, nilaiPo: p?.nilai ?? 0, nilaiDpp: p?.nilaiDpp ?? 0, pakaiTagihan, dasar, untung, margin: hitungMargin(untung, dasar) };
}
