import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

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
  items: InvoicePdfItem[];
  subtotal: number;
  ppn: number;
  total: number;
  amountPaid?: number;
  outstandingAmount?: number;
  status: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

const toRomanMonth = (month: number) => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][month - 1] || "I";
const buildLetterNumber = (id: string, date: Date) => `${id.replace(/\D/g, "") || "0001"}/MUI/INV/${toRomanMonth(date.getMonth() + 1)}/${date.getFullYear()}`;

type JsPdfWithLastAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY?: number;
  };
};

function drawWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 5) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function generateInvoiceLetterPDF(data: InvoicePdfData) {
  const doc = new jsPDF("p", "mm", "a4");
  const letterNumber = buildLetterNumber(data.id, data.date);

  const companyName = data.companyName || "PT. Manggala Utama Indonesia";
  const companyEmail = data.companyEmail || "admin@manggala-utama.id";
  const companyPhone = data.companyPhone || "+62 878-8424-1703";
  const companyAddress = data.companyAddress || "Jakarta";
  const invoiceTitle = data.subject || "INVOICE";
  const outstandingAmount = data.outstandingAmount ?? Math.max(data.total - (data.amountPaid ?? 0), 0);

  doc.setFillColor(14, 77, 146);
  doc.rect(0, 0, 210, 10, "F");

  doc.setTextColor(20, 41, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(companyName, 14, 22);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  doc.setFontSize(8.5);
  doc.text(companyAddress, 14, 28);
  doc.text(`${companyPhone} • ${companyEmail}`, 14, 33);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(14, 77, 146);
  doc.setFontSize(26);
  doc.text(invoiceTitle.toUpperCase(), 196, 22, { align: "right" });

  doc.setDrawColor(215, 221, 228);
  doc.line(14, 40, 196, 40);

  doc.setTextColor(20, 41, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("INVOICE KEPADA", 14, 50);
  doc.text("DETAIL INVOICE", 126, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let leftY = 57;
  doc.text(data.recipientName || data.client, 14, leftY);
  leftY += 5;
  if (data.recipientCompany) {
    doc.text(data.recipientCompany, 14, leftY);
    leftY += 5;
  }
  doc.text(data.recipientAddress || "Di tempat", 14, leftY);

  const infoX = 126;
  let infoY = 57;
  const infoRows = [
    ["Nomor", letterNumber],
    ["Tanggal", format(data.date, "dd MMMM yyyy")],
    ["Jatuh Tempo", data.dueDate ? format(data.dueDate, "dd MMMM yyyy") : "-"],
    ["Pembayaran", data.paymentMethod || "CBD"],
  ];
  infoRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, infoX, infoY);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${value}`, infoX + 23, infoY);
    infoY += 6;
  });

  let y = 82;
  y = drawWrappedText(
    doc,
    data.introduction || "Bersama ini kami sampaikan invoice/tagihan atas pekerjaan atau pengadaan yang telah kami laksanakan dengan rincian sebagai berikut:",
    14,
    y,
    182,
    5,
  );

  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["No", "Description", "Qty", "Unit", "Price", "Amount"]],
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
      cellPadding: 2.8,
      valign: "top",
      lineColor: [220, 225, 230],
      lineWidth: 0.15,
      textColor: [35, 35, 35],
    },
    headStyles: {
      fillColor: [242, 196, 76],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { cellWidth: 82 },
      2: { halign: "center", cellWidth: 14 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "right", cellWidth: 28 },
      5: { halign: "right", cellWidth: 28 },
    },
  });

  y = ((doc as JsPdfWithLastAutoTable).lastAutoTable?.finalY ?? y) + 8;

  const summaryX = 124;
  const summaryWidth = 72;
  const summaryRowHeight = 7;
  const summaryRows = [
    ["Subtotal", formatCurrency(data.subtotal)],
    ["PPN", formatCurrency(data.ppn)],
    ["Total", formatCurrency(data.total)],
    ["Terbayar", formatCurrency(data.amountPaid ?? 0)],
    ["Sisa Tagihan", formatCurrency(outstandingAmount)],
  ];

  doc.setDrawColor(214, 220, 226);
  summaryRows.forEach(([label, value], index) => {
    const rowY = y + index * summaryRowHeight;
    if (label === "Total") {
      doc.setFillColor(236, 244, 255);
      doc.rect(summaryX, rowY - 4.5, summaryWidth, summaryRowHeight, "F");
    }
    doc.rect(summaryX, rowY - 4.5, summaryWidth, summaryRowHeight);
    doc.setFont("helvetica", label === "Total" || label === "Sisa Tagihan" ? "bold" : "normal");
    doc.setTextColor(20, 41, 68);
    doc.text(label, summaryX + 3, rowY);
    doc.text(String(value), summaryX + summaryWidth - 3, rowY, { align: "right" });
  });

  let notesY = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("Informasi Pembayaran", 14, notesY);
  notesY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const terms = (data.terms || "Pembayaran sesuai metode yang disepakati\nMohon mencantumkan nomor invoice pada transfer\nInvoice dianggap sah tanpa tanda tangan basah")
    .split("\n")
    .filter(Boolean);
  terms.forEach((term) => {
    doc.text(`• ${term}`, 16, notesY);
    notesY += 5;
  });

  if (data.closingNote) {
    notesY += 3;
    notesY = drawWrappedText(doc, data.closingNote, 14, notesY, 100, 5);
  }

  let signY = Math.max(notesY + 12, y + summaryRows.length * summaryRowHeight + 18);
  if (signY > 250) signY = 250;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(format(data.date, "dd MMMM yyyy"), 135, signY);
  signY += 8;
  doc.text("Hormat kami,", 135, signY);
  signY += 24;
  doc.setFont("helvetica", "bold");
  doc.text(data.signatoryName || "Adiatma Pasau", 135, signY);
  signY += 5;
  doc.setFont("helvetica", "normal");
  doc.text(data.signatoryTitle || "Manager Marketing", 135, signY);

  doc.setFillColor(14, 77, 146);
  doc.rect(0, 287, 210, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`${companyName}  •  ${companyEmail}  •  ${companyPhone}`, 14, 293);

  doc.save(`${letterNumber.replace(/\//g, "-")}.pdf`);
}
