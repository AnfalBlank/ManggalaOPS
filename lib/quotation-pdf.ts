import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { drawSignatureAndStamp, preloadSignatureStamp } from "@/lib/pdf-signature";
import { tampilkanPdf } from "@/lib/dokumen-pdf";

export type QuotationPdfItem = {
  description: string;
  qty: number;
  unit?: string | null;
  unitPrice: number;
  amount: number;
  imageUrl?: string | null;
};

export type QuotationPdfData = {
  id: string;
  client: string;
  project: string;
  date: Date;
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  validUntil?: Date | null;
  paymentMethod?: string | null;
  attachment?: string | null;
  subject?: string | null;
  recipientName?: string | null;
  recipientCompany?: string | null;
  recipientAddress?: string | null;
  introduction?: string | null;
  terms?: string | null;
  closingNote?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  signatureImageUrl?: string | null;
  stampImageUrl?: string | null;
  items: QuotationPdfItem[];
  subtotal: number;
  ppn: number;
  total: number;
  status: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

const toRomanMonth = (m: number) => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][m - 1] || "I";

// `id` = nomor surat tersimpan (0001/MUI/SP/…). Kode pendek lama (QUO-0079) masih dihitung pakai rumus lama.
function buildLetterNumber(id: string, date: Date) {
  if (id.includes("/")) return id;
  return `${id.replace(/\D/g, "") || "0001"}/MUI/SP/${toRomanMonth(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxW: number, lh = 5): number {
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y);
  return y + lines.length * lh;
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const proxyUrl = url.replace(/^\/uploads\//, "/api/uploads/");
  const abs = proxyUrl.startsWith("http") ? proxyUrl : `${window.location.origin}${proxyUrl}`;
  const res = await fetch(abs);
  if (!res.ok) throw new Error(`${res.status}`);
  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) throw new Error("not image");
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(blob);
  });
}

type DocExt = jsPDF & { lastAutoTable?: { finalY?: number } };

// Content area: top 14mm (banner+margin) to 284mm (footer starts at 287).
// We leave 3mm breathing room above footer.
const CONTENT_TOP = 14;
const CONTENT_BOTTOM = 282;

function needsNewPage(y: number, need: number): boolean {
  return y + need > CONTENT_BOTTOM;
}

function pageBreak(doc: jsPDF): number {
  doc.addPage();
  return CONTENT_TOP + 6; // start below top banner
}

export async function generateQuotationPDF(data: QuotationPdfData) {
  const doc = new jsPDF("p", "mm", "a4");
  const letterNumber = buildLetterNumber(data.id, data.date);

  const sigStamp = await preloadSignatureStamp({
    signatureImageUrl: data.signatureImageUrl,
    stampImageUrl: data.stampImageUrl,
  });

  const companyName = data.companyName || "PT. Manggala Utama Indonesia";
  const companyEmail = data.companyEmail || "admin@manggala-utama.id";
  const companyPhone = data.companyPhone || "+62 878-8424-1703";
  const companyAddress = data.companyAddress || "Jakarta";

  // ========== PAGE 1 HEADER ==========
  doc.setFont("helvetica", "bold");
  doc.setTextColor(19, 70, 122);
  doc.setFontSize(20);
  doc.text(companyName, 14, 22);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  doc.setFontSize(8.3);
  doc.text("IT Solutions • Procurement • Software Development • Infrastructure", 14, 28);
  doc.text(`${companyAddress} • ${companyPhone} • ${companyEmail}`, 14, 33);

  doc.setDrawColor(160);
  doc.setLineWidth(0.3);
  doc.line(14, 38, 196, 38);

  // ========== LETTER INFO ==========
  doc.setTextColor(0);
  doc.setFontSize(10);
  const infoY = 46;
  const fields = [
    ["Nomor", letterNumber],
    ["Tanggal", format(data.date, "dd MMMM yyyy", { locale: localeId })],
    ["Lampiran", data.attachment || "-"],
    ["Perihal", data.subject || "Surat Penawaran"],
  ];
  fields.forEach(([label, val], i) => {
    const fy = infoY + i * 6;
    doc.setFont("helvetica", "normal");
    doc.text(label, 14, fy);
    doc.text(":", 36, fy);
    doc.text(val, 40, fy);
  });

  // ========== RECIPIENT ==========
  let y = infoY + fields.length * 6 + 8;
  doc.text(`Kepada Yth. ${data.recipientName || data.client}`, 14, y);
  y += 5;
  if (data.recipientCompany) {
    doc.text(data.recipientCompany, 14, y);
    y += 5;
  }
  if (data.recipientAddress) {
    y = wrapText(doc, data.recipientAddress, 14, y, 120, 5);
  } else {
    doc.text("Di tempat", 14, y);
    y += 5;
  }
  y += 5;
  doc.text("Dengan hormat,", 14, y);
  y += 7;

  // ========== INTRODUCTION ==========
  doc.setFontSize(9.5);
  y = wrapText(
    doc,
    data.introduction || "Perkenalkan kami PT. Manggala Utama Indonesia adalah perusahaan berfokus pada bidang Teknologi Informasi, Pembuatan/Pengembangan Software, serta infrastruktur TI. Bersama ini kami sampaikan surat penawaran sebagai berikut:",
    14, y, 182, 4.5,
  );
  y += 4;

  // ========== ITEM TABLE ==========
  autoTable(doc, {
    startY: y,
    head: [["No", "Nama Barang / Jasa", "Jml", "Satuan", "Harga Satuan", "Jumlah Harga"]],
    body: data.items.map((item, i) => [
      String(i + 1),
      item.description,
      String(item.qty),
      item.unit || "Unit",
      formatCurrency(item.unitPrice),
      formatCurrency(item.amount),
    ]),
    foot: [
      ["", "", "", "", "Subtotal", formatCurrency(data.subtotal)],
      ["", "", "", "", "PPN", formatCurrency(data.ppn)],
      ["", "", "", "", "Total", formatCurrency(data.total)],
    ],
    theme: "grid",
    margin: { left: 14, right: 14, top: 20, bottom: 18 },
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 2,
      valign: "middle",
      lineColor: [100, 100, 100],
      lineWidth: 0.15,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [255, 235, 59],
      textColor: [0, 0, 0],
      halign: "center",
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fillColor: [255, 253, 240],
      textColor: [0, 0, 0],
    },
    footStyles: {
      fillColor: [198, 239, 206],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 12 },
      3: { halign: "center", cellWidth: 14 },
      4: { halign: "right", cellWidth: 28 },
      5: { halign: "right", cellWidth: 28 },
    },
  });

  y = ((doc as DocExt).lastAutoTable?.finalY ?? y) + 8;

  // ========== TERMS ==========
  if (needsNewPage(y, 30)) y = pageBreak(doc);
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Syarat dan Ketentuan", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const terms = (data.terms || "Harga sudah termasuk unit utama\nHarga belum termasuk PPN 11%\nPenawaran berlaku selama 7 hari\nPembayaran mengikuti kesepakatan term/CBD")
    .split("\n").filter(Boolean);
  for (const term of terms) {
    if (needsNewPage(y, 6)) y = pageBreak(doc);
    doc.text(`• ${term}`, 18, y);
    y += 5;
  }

  // ========== CLOSING ==========
  y += 3;
  if (needsNewPage(y, 15)) y = pageBreak(doc);
  doc.setFontSize(9);
  y = wrapText(
    doc,
    data.closingNote || "Demikian surat penawaran ini kami sampaikan. Besar harapan kami untuk dapat bekerjasama dengan Bapak/Ibu dalam kebutuhan pengadaan maupun proyek TI yang direncanakan.",
    14, y, 182, 4.5,
  );

  // ========== SIGNATURE ==========
  y += 8;
  if (needsNewPage(y, 40)) y = pageBreak(doc);
  const signX = 140;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Hormat Kami,", signX, y);
  const signImgY = y + 2;
  y += 22;

  // Digital signature and stamp.
  drawSignatureAndStamp(doc, signX - 5, signImgY, sigStamp.signatureB64, sigStamp.stampB64);

  doc.setFont("helvetica", "bold");
  doc.text(data.signatoryName || "Adiatma Pasau", signX, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text(data.signatoryTitle || "Manager Marketing", signX, y);

  // ========== PHOTO ATTACHMENTS ==========
  const itemsWithImages = data.items.filter(item => item.imageUrl);
  if (itemsWithImages.length > 0) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("LAMPIRAN FOTO", 105, 25, { align: "center" });
    let curY = 38;
    let col = 0;
    const imgW = 85, imgH = 85;
    for (const item of itemsWithImages) {
      if (curY + imgH + 15 > CONTENT_BOTTOM) { doc.addPage(); curY = 20; col = 0; }
      const bx = col === 0 ? 14 : 14 + imgW + 12;
      try {
        const b64 = await fetchImageAsBase64(item.imageUrl!);
        doc.addImage(b64, "AUTO", bx, curY, imgW, imgH);
      } catch {
        doc.setDrawColor(200);
        doc.rect(bx, curY, imgW, imgH);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("Gambar tak termuat", bx + imgW / 2, curY + imgH / 2, { align: "center" });
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(0);
      wrapText(doc, (item.description || "").split("\n")[0], bx, curY + imgH + 4, imgW, 4);
      col++;
      if (col > 1) { col = 0; curY += imgH + 18; }
    }
  }

  // ========== BANNERS ON ALL PAGES ==========
  const pages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    // Top banner
    doc.setFillColor(19, 70, 122);
    doc.rect(0, 0, 210, 8, "F");
    doc.setFillColor(47, 128, 237);
    doc.rect(0, 8, 210, 3.5, "F");
    // Bottom banner
    doc.setFillColor(19, 70, 122);
    doc.rect(0, 287, 210, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`${companyName}  •  ${companyEmail}  •  ${companyAddress}`, 14, 292.5);
    doc.text(`Halaman ${i} dari ${pages}`, 196, 292.5, { align: "right" });
  }

  tampilkanPdf(doc, `${letterNumber.replace(/\//g, "-")}.pdf`);
}
