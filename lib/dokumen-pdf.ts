import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

let tabDisiapkan: Window | null = null;

// Panggil langsung di klik tombol (sebelum await apa pun) kalau PDF-nya dibikin pakai proses yang nunggu,
// supaya tab barunya gak dianggap popup dan diblokir browser.
export function siapkanTab() {
  tabDisiapkan = window.open("", "_blank");
  if (tabDisiapkan) tabDisiapkan.document.title = "Menyiapkan dokumen…";
}

export function batalkanTab() {
  if (tabDisiapkan && !tabDisiapkan.closed) tabDisiapkan.close();
  tabDisiapkan = null;
}

// Buka PDF di tab baru supaya bisa dilihat dulu (unduh dari penampil PDF browser).
// Kalau browser nahan tab baru (popup diblokir), file langsung diunduh.
export function tampilkanPdf(doc: jsPDF, filename: string) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(new File([blob], filename, { type: "application/pdf" }));
  let tab = tabDisiapkan;
  tabDisiapkan = null;
  if (tab && !tab.closed) tab.location.href = url;
  else tab = window.open(url, "_blank");
  if (!tab) {
    doc.save(filename);
  }
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
}

export type Kop = {
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
};

type JsPdfWithLastAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };

const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const romawi = (m: number) => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][m - 1] || "I";
export const nomorSurat = (id: number, jenis: string, tanggal: Date) => `${String(id).padStart(4, "0")}/MUI/${jenis}/${romawi(tanggal.getMonth() + 1)}/${tanggal.getFullYear()}`;
const tgl = (d: Date) => format(d, "dd MMMM yyyy");

function kepala(doc: jsPDF, kop: Kop, judul: string) {
  const companyName = kop.companyName || "PT. Manggala Utama Indonesia";
  doc.setTextColor(20, 41, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(companyName, 14, 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  doc.setFontSize(8.5);
  doc.text(kop.companyAddress || "Jakarta", 14, 28);
  doc.text(`${kop.companyPhone || "+62 878-8424-1703"} • ${kop.companyEmail || "admin@manggala-utama.id"}`, 14, 33);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(14, 77, 146);
  doc.setFontSize(20);
  doc.text(judul, 196, 22, { align: "right" });
  doc.setDrawColor(215, 221, 228);
  doc.line(14, 40, 196, 40);
}

function blokKiriKanan(doc: jsPDF, judulKiri: string, kiri: string[], judulKanan: string, kanan: [string, string][]) {
  doc.setTextColor(20, 41, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(judulKiri, 14, 50);
  doc.text(judulKanan, 120, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  let y = 56;
  for (const baris of kiri.filter(Boolean)) {
    const lines = doc.splitTextToSize(baris, 98);
    doc.text(lines, 14, y);
    y += lines.length * 5;
  }
  let y2 = 56;
  for (const [label, nilai] of kanan) {
    doc.setFont("helvetica", "bold");
    doc.text(label, 120, y2);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(`: ${nilai}`, 38);
    doc.text(lines, 158, y2);
    y2 += lines.length * 5 + 1;
  }
  return Math.max(y, y2) + 4;
}

function kaki(doc: jsPDF, kop: Kop) {
  const companyName = kop.companyName || "PT. Manggala Utama Indonesia";
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFillColor(14, 77, 146);
    doc.rect(0, 0, 210, 10, "F");
    doc.rect(0, 287, 210, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${companyName}  •  ${kop.companyEmail || "admin@manggala-utama.id"}  •  ${kop.companyPhone || "+62 878-8424-1703"}`, 14, 293);
    doc.text(`Halaman ${i} dari ${n}`, 196, 293, { align: "right" });
  }
}

function tandaTangan(doc: jsPDF, y: number, kolom: { judul: string; nama?: string | null; jabatan?: string | null }[]) {
  if (y > 240) {
    doc.addPage();
    y = 30;
  }
  const lebar = 182 / kolom.length;
  doc.setTextColor(20, 41, 68);
  doc.setFontSize(9.5);
  kolom.forEach((k, i) => {
    const x = 14 + i * lebar + lebar / 2;
    doc.setFont("helvetica", "normal");
    doc.text(k.judul, x, y, { align: "center" });
    doc.line(x - 25, y + 26, x + 25, y + 26);
    doc.setFont("helvetica", "bold");
    if (k.nama) doc.text(k.nama, x, y + 31, { align: "center" });
    doc.setFont("helvetica", "normal");
    if (k.jabatan) doc.text(k.jabatan, x, y + 36, { align: "center" });
  });
}

const gayaTabel = {
  theme: "grid" as const,
  margin: { bottom: 25 },
  styles: { font: "helvetica", fontSize: 9, cellPadding: 2.6, valign: "top" as const, lineColor: [220, 225, 230] as [number, number, number], lineWidth: 0.15, textColor: [35, 35, 35] as [number, number, number] },
  headStyles: { fillColor: [242, 196, 76] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontStyle: "bold" as const, halign: "center" as const },
};

export type PoSupplierPdf = {
  id: number;
  date: Date;
  supplierName: string;
  supplierContact?: string | null;
  supplierPhone?: string | null;
  supplierAddress?: string | null;
  expectedDate?: Date | null;
  paymentTerms?: string | null;
  notes?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  items: { description: string; qty: number; unit: string; unitPrice: number; amount: number }[];
};

export function buatPoSupplierPdf(data: PoSupplierPdf, kop: Kop) {
  const doc = new jsPDF("p", "mm", "a4");
  const nomor = nomorSurat(data.id, "PO", data.date);
  kepala(doc, kop, "PURCHASE ORDER");
  let y = blokKiriKanan(
    doc,
    "KEPADA",
    [data.supplierName, data.supplierContact ? `Up. ${data.supplierContact}` : "", data.supplierAddress || "", data.supplierPhone ? `Telp. ${data.supplierPhone}` : ""],
    "DETAIL PO",
    [
      ["Nomor", nomor],
      ["Tanggal", tgl(data.date)],
      ["Kirim paling lambat", data.expectedDate ? tgl(data.expectedDate) : "-"],
      ["Pembayaran", data.paymentTerms || "-"],
    ],
  );
  autoTable(doc, {
    ...gayaTabel,
    startY: y,
    head: [["No", "Nama barang", "Jumlah", "Satuan", "Harga", "Total"]],
    body: data.items.map((i, n) => [String(n + 1), i.description, String(i.qty), i.unit, rupiah(i.unitPrice), rupiah(i.amount)]),
    columnStyles: { 0: { halign: "center", cellWidth: 12 }, 1: { cellWidth: 74 }, 2: { halign: "center", cellWidth: 16 }, 3: { halign: "center", cellWidth: 18 }, 4: { halign: "right", cellWidth: 31 }, 5: { halign: "right", cellWidth: 31 } },
  });
  y = ((doc as JsPdfWithLastAutoTable).lastAutoTable?.finalY ?? y) + 8;
  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  doc.setDrawColor(214, 220, 226);
  doc.setTextColor(20, 41, 68);
  doc.setFontSize(9.5);
  [["Subtotal", rupiah(data.subtotal)], ["PPN", rupiah(data.tax)], ["Total", rupiah(data.total)]].forEach(([l, v], i) => {
    const ry = y + i * 7;
    doc.rect(124, ry - 4.5, 72, 7);
    doc.setFont("helvetica", l === "Total" ? "bold" : "normal");
    doc.text(l, 127, ry);
    doc.text(v, 193, ry, { align: "right" });
  });
  doc.setFont("helvetica", "normal");
  const catatan = doc.splitTextToSize(data.notes || "Mohon cantumkan nomor PO ini pada surat jalan dan invoice Anda.", 100);
  doc.text(catatan, 14, y);
  y = Math.max(y + 28, y + catatan.length * 5 + 10);
  tandaTangan(doc, y, [
    { judul: "Disetujui supplier,", nama: null, jabatan: "Nama, tanda tangan & cap" },
    { judul: "Hormat kami,", nama: data.signatoryName || null, jabatan: data.signatoryTitle || null },
  ]);
  kaki(doc, kop);
  tampilkanPdf(doc, `${nomor.replace(/\//g, "-")}.pdf`);
}
