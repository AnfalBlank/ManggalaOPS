import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { drawSignatureAndStamp, preloadSignatureStamp } from "@/lib/pdf-signature";

export type InvoicePdfItem = {
  description: string;
  qty: number;
  unit?: string | null;
  unitPrice: number;
  amount: number;
};

export type InvoicePdfData = {
  id: string;
  client: string;
  project: string;
  date: Date;
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  dueDate?: Date | null;
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
  items: InvoicePdfItem[];
  subtotal: number;
  ppn: number;
  total: number;
  amountPaid?: number;
  outstandingAmount?: number;
  status: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

const toRomanMonth = (m: number) => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][m - 1] || "I";
const buildLetterNumber = (id: string, date: Date) => `${id.replace(/\D/g, "") || "0001"}/MUI/INV/${toRomanMonth(date.getMonth() + 1)}/${date.getFullYear()}`;

type DocExt = jsPDF & { lastAutoTable?: { finalY?: number } };

const CONTENT_BOTTOM = 282;

function needsNewPage(y: number, need: number) { return y + need > CONTENT_BOTTOM; }
function pageBreak(doc: jsPDF) { doc.addPage(); return 20; }

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxW: number, lh = 5) {
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y);
  return y + lines.length * lh;
}

export async function generateInvoiceLetterPDF(data: InvoicePdfData) {
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
  const invoiceTitle = data.subject || "INVOICE";
  const outstandingAmount = data.outstandingAmount ?? Math.max(data.total - (data.amountPaid ?? 0), 0);

  // ========== HEADER ==========
  doc.setTextColor(20, 41, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(companyName, 14, 22);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  doc.setFontSize(8.5);
  doc.text(companyAddress, 14, 28);
  doc.text(`${companyPhone} • ${companyEmail}`, 14, 33);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(14, 77, 146);
  doc.setFontSize(24);
  doc.text(invoiceTitle.toUpperCase(), 196, 22, { align: "right" });

  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.3);
  doc.line(14, 38, 196, 38);

  // ========== RECIPIENT + DETAILS ==========
  doc.setTextColor(20, 41, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("INVOICE KEPADA", 14, 46);
  doc.text("DETAIL INVOICE", 126, 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  let leftY = 53;
  doc.text(data.recipientName || data.client, 14, leftY); leftY += 5;
  if (data.recipientCompany) { doc.text(data.recipientCompany, 14, leftY); leftY += 5; }
  doc.text(data.recipientAddress || "Di tempat", 14, leftY);

  let infoY = 53;
  const infoRows: [string, string][] = [
    ["Nomor", letterNumber],
    ["Tanggal", format(data.date, "dd MMMM yyyy")],
    ["Jatuh Tempo", data.dueDate ? format(data.dueDate, "dd MMMM yyyy") : "-"],
    ["Pembayaran", data.paymentMethod || "CBD"],
  ];
  infoRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 126, infoY);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${value}`, 148, infoY);
    infoY += 5.5;
  });

  // ========== INTRO ==========
  let y = Math.max(leftY + 10, infoY + 6);
  doc.setFontSize(9);
  y = wrapText(
    doc,
    data.introduction || "Bersama ini kami sampaikan invoice/tagihan atas pekerjaan atau pengadaan yang telah kami laksanakan dengan rincian sebagai berikut:",
    14, y, 182, 4.5,
  );
  y += 4;

  // ========== TABLE ==========
  autoTable(doc, {
    startY: y,
    head: [["No", "Description", "Qty", "Unit", "Price", "Amount"]],
    body: data.items.map((item, i) => [
      String(i + 1),
      item.description,
      String(item.qty),
      item.unit || "Unit",
      formatCurrency(item.unitPrice),
      formatCurrency(item.amount),
    ]),
    theme: "grid",
    margin: { left: 14, right: 14, top: 20, bottom: 18 },
    styles: {
      font: "helvetica", fontSize: 8.5, cellPadding: 2, valign: "middle",
      lineColor: [180, 180, 180], lineWidth: 0.15, overflow: "linebreak",
    },
    headStyles: { fillColor: [242, 196, 76], textColor: [0, 0, 0], fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 12 },
      3: { halign: "center", cellWidth: 14 },
      4: { halign: "right", cellWidth: 26 },
      5: { halign: "right", cellWidth: 26 },
    },
  });

  y = ((doc as DocExt).lastAutoTable?.finalY ?? y) + 6;

  // ========== SUMMARY ==========
  if (needsNewPage(y, 45)) y = pageBreak(doc);
  const sx = 126, sw = 70, sh = 6.5;
  const summaryRows: [string, string][] = [
    ["Subtotal", formatCurrency(data.subtotal)],
    ["PPN", formatCurrency(data.ppn)],
    ["Total", formatCurrency(data.total)],
    ["Terbayar", formatCurrency(data.amountPaid ?? 0)],
    ["Sisa Tagihan", formatCurrency(outstandingAmount)],
  ];
  doc.setDrawColor(200, 210, 220);
  summaryRows.forEach(([label, value], i) => {
    const ry = y + i * sh;
    if (label === "Total") { doc.setFillColor(236, 244, 255); doc.rect(sx, ry - 4, sw, sh, "F"); }
    doc.rect(sx, ry - 4, sw, sh);
    doc.setFont("helvetica", (label === "Total" || label === "Sisa Tagihan") ? "bold" : "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 41, 68);
    doc.text(label, sx + 2, ry);
    doc.text(value, sx + sw - 2, ry, { align: "right" });
  });

  // ========== PAYMENT INFO (left, beside summary) ==========
  let ny = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Informasi Pembayaran", 14, ny); ny += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Transfer ke:", 14, ny); ny += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Bank Mandiri", 14, ny); ny += 4;
  doc.setFont("helvetica", "normal");
  doc.text("a.n. PT. Manggala Utama Indonesia", 14, ny); ny += 4;
  doc.text("Rek: 1660 0070 95094", 14, ny); ny += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Catatan", 14, ny); ny += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const terms = (data.terms || "Pembayaran sesuai metode yang disepakati\nMohon mencantumkan nomor invoice pada transfer\nInvoice dianggap sah tanpa tanda tangan basah")
    .split("\n").filter(Boolean);
  for (const t of terms) {
    if (needsNewPage(ny, 5)) ny = pageBreak(doc);
    doc.text(`• ${t}`, 16, ny);
    ny += 4.5;
  }

  if (data.closingNote) {
    ny += 3;
    if (needsNewPage(ny, 12)) ny = pageBreak(doc);
    ny = wrapText(doc, data.closingNote, 14, ny, 100, 4.5);
  }

  // ========== SIGNATURE ==========
  let signY = Math.max(ny + 10, y + summaryRows.length * sh + 10);
  if (needsNewPage(signY, 38)) signY = pageBreak(doc);
  const signX = 135;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(20, 41, 68);
  doc.text(format(data.date, "dd MMMM yyyy"), signX, signY); signY += 6;
  doc.text("Hormat kami,", signX, signY);
  const signImgY = signY + 2;
  signY += 22;

  drawSignatureAndStamp(doc, signX - 5, signImgY, sigStamp.signatureB64, sigStamp.stampB64);

  doc.setFont("helvetica", "bold");
  doc.text(data.signatoryName || "Adiatma Pasau", signX, signY); signY += 4;
  doc.setFont("helvetica", "normal");
  doc.text(data.signatoryTitle || "Manager Marketing", signX, signY);

  // ========== FOOTER ON ALL PAGES ==========
  const pages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(14, 77, 146);
    doc.rect(0, 0, 210, 10, "F");
    doc.setFillColor(14, 77, 146);
    doc.rect(0, 287, 210, 10, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`${companyName}  •  ${companyEmail}  •  ${companyPhone}`, 14, 292.5);
    doc.text(`Page ${i} of ${pages}`, 196, 292.5, { align: "right" });
  }

  doc.save(`${letterNumber.replace(/\//g, "-")}.pdf`);
}
