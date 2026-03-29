import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export type QuotationPdfItem = {
  description: string;
  qty: number;
  unit?: string | null;
  unitPrice: number;
  amount: number;
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
  items: QuotationPdfItem[];
  subtotal: number;
  ppn: number;
  total: number;
  status: string;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const toRomanMonth = (month: number) => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][month - 1] || "I";

function drawWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 5) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function buildLetterNumber(id: string, date: Date) {
  const number = id.replace(/\D/g, "") || "0001";
  return `${number}/MUI/SP/${toRomanMonth(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function generateQuotationPDF(data: QuotationPdfData) {
  const doc = new jsPDF("p", "mm", "a4");
  const letterNumber = buildLetterNumber(data.id, data.date);

  doc.setFillColor(19, 70, 122);
  doc.rect(0, 0, 210, 8, "F");
  doc.setFillColor(47, 128, 237);
  doc.rect(0, 8, 210, 4, "F");

  const companyName = data.companyName || "PT. Manggala Utama Indonesia";
  const companyEmail = data.companyEmail || "admin@manggala-utama.id";
  const companyPhone = data.companyPhone || "+62 878-8424-1703";
  const companyAddress = data.companyAddress || "Jakarta";

  doc.setFont("helvetica", "bold");
  doc.setTextColor(19, 70, 122);
  doc.setFontSize(20);
  doc.text(companyName, 14, 22);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  doc.setFontSize(8.3);
  doc.text("IT Solutions • Procurement • Software Development • Infrastructure", 14, 28);
  doc.text(`${companyAddress} • ${companyPhone} • ${companyEmail}`, 14, 33);

  doc.setDrawColor(180);
  doc.line(14, 43, 196, 43);

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text("Nomor", 14, 51);
  doc.text(":", 38, 51);
  doc.text(letterNumber, 42, 51);
  doc.text("Tanggal", 14, 57);
  doc.text(":", 38, 57);
  doc.text(format(data.date, "dd MMMM yyyy"), 42, 57);
  doc.text("Lampiran", 14, 63);
  doc.text(":", 38, 63);
  doc.text(data.attachment || "-", 42, 63);
  doc.text("Perihal", 14, 69);
  doc.text(":", 38, 69);
  doc.text(data.subject || "Surat Penawaran", 42, 69);

  let y = 81;
  doc.text(`Kepada Yth. ${data.recipientName || data.client}`, 14, y);
  y += 6;
  if (data.recipientCompany) {
    doc.text(data.recipientCompany, 14, y);
    y += 6;
  }
  doc.text(data.recipientAddress || "Di tempat", 14, y);
  y += 8;
  doc.text("Dengan hormat,", 14, y);
  y += 8;

  y = drawWrappedText(
    doc,
    data.introduction ||
      "Perkenalkan kami PT. Manggala Utama Indonesia adalah perusahaan berfokus pada bidang Teknologi Informasi, Pembuatan/Pengembangan Software, serta infrastruktur TI. Bersama ini kami sampaikan surat penawaran sebagai berikut:",
    14,
    y,
    182,
  );

  y += 5;
  autoTable(doc, {
    startY: y,
    head: [["No", "Nama Barang / Jasa", "Qty", "Unit", "Harga Satuan", "Jumlah Harga"]],
    body: data.items.map((item, index) => [
      String(index + 1),
      item.description,
      String(item.qty),
      item.unit || "Unit",
      formatCurrency(item.unitPrice),
      formatCurrency(item.amount),
    ]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.5,
      valign: "top",
      lineColor: [120, 120, 120],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [255, 235, 59],
      textColor: [0, 0, 0],
      halign: "center",
      fontStyle: "bold",
    },
    bodyStyles: {
      fillColor: [255, 252, 229],
      textColor: [0, 0, 0],
    },
    foot: [
      ["", "", "", "", "Subtotal", formatCurrency(data.subtotal)],
      ["", "", "", "", "PPN", formatCurrency(data.ppn)],
      ["", "", "", "", "Total", formatCurrency(data.total)],
    ],
    footStyles: {
      fillColor: [198, 239, 206],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { cellWidth: 78 },
      2: { halign: "center", cellWidth: 12 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "right", cellWidth: 32 },
      5: { halign: "right", cellWidth: 30 },
    },
  });

  y = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 8;

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(11);
  doc.text("Term and Conditions", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const terms = (data.terms || "Harga sudah termasuk unit utama\nHarga belum termasuk PPN 11%\nPenawaran berlaku selama 7 hari\nPembayaran mengikuti kesepakatan term/CBD")
    .split("\n")
    .filter(Boolean);
  terms.forEach((term) => {
    doc.text(`• ${term}`, 18, y);
    y += 6;
  });

  y += 5;
  y = drawWrappedText(
    doc,
    data.closingNote ||
      "Demikian surat penawaran ini kami sampaikan. Besar harapan kami untuk dapat bekerjasama dengan Bapak/Ibu dalam kebutuhan pengadaan maupun proyek TI yang direncanakan.",
    14,
    y,
    182,
  );

  y += 12;
  doc.text("Hormat Kami,", 145, y);
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.text(data.signatoryName || "Adiatma Pasau", 145, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(data.signatoryTitle || "Manager Marketing", 145, y);

  doc.setFillColor(19, 70, 122);
  doc.rect(0, 287, 210, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`${companyName}  •  ${companyEmail}  •  ${companyAddress}`, 14, 293);

  doc.save(`${letterNumber.replace(/\//g, "-")}.pdf`);
}
