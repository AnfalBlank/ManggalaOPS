import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

type InvoicePdfData = {
  id: string;
  client: string;
  project: string;
  date: Date;
  dueDate: Date;
  subtotal: number;
  ppn: number;
  total: number;
  amountPaid?: number;
  status: string;
};

type ReceiptPdfData = {
  id: string;
  client: string;
  amount: number;
  description: string;
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
};

type JsPdfWithLastAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY?: number;
  };
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

function toWordsId(value: number) {
  const words = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];

  const spell = (n: number): string => {
    if (n < 12) return words[n];
    if (n < 20) return `${spell(n - 10)} Belas`;
    if (n < 100) return `${spell(Math.floor(n / 10))} Puluh ${spell(n % 10)}`.trim();
    if (n < 200) return `Seratus ${spell(n - 100)}`.trim();
    if (n < 1000) return `${spell(Math.floor(n / 100))} Ratus ${spell(n % 100)}`.trim();
    if (n < 2000) return `Seribu ${spell(n - 1000)}`.trim();
    if (n < 1000000) return `${spell(Math.floor(n / 1000))} Ribu ${spell(n % 1000)}`.trim();
    if (n < 1000000000) return `${spell(Math.floor(n / 1000000))} Juta ${spell(n % 1000000)}`.trim();
    return `${spell(Math.floor(n / 1000000000))} Miliar ${spell(n % 1000000000)}`.trim();
  };

  return `${spell(Math.round(value)).replace(/\s+/g, " ").trim()} Rupiah`;
}

export const generateInvoicePDF = (invoiceData: InvoicePdfData) => {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(29, 78, 216);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("PT. Manggala Utama Indonesia", 14, 30);
  doc.text("Jl. Gatot Subroto No. 45, Jakarta Selatan", 14, 35);
  doc.text("Email: info@manggala.co.id", 14, 40);

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceData.client, 14, 60);

  doc.setFont("helvetica", "bold");
  doc.text("Invoice #:", 130, 55);
  doc.text("Date:", 130, 60);
  doc.text("Due Date:", 130, 65);

  doc.setFont("helvetica", "normal");
  doc.text(invoiceData.id, 160, 55);
  doc.text(format(invoiceData.date, "dd MMM yyyy"), 160, 60);
  doc.text(format(invoiceData.dueDate, "dd MMM yyyy"), 160, 65);

  autoTable(doc, {
    startY: 75,
    head: [["Description", "Amount"]],
    body: [[invoiceData.project, formatCurrency(invoiceData.subtotal)]],
    theme: "striped",
    headStyles: { fillColor: [29, 78, 216] },
    styles: { font: "helvetica" },
  });

  const finalY = (doc as JsPdfWithLastAutoTable).lastAutoTable?.finalY ?? 75;

  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", 130, finalY + 10);
  doc.text("PPN 11%:", 130, finalY + 15);

  doc.setFont("helvetica", "bold");
  doc.text("Total:", 130, finalY + 22);

  doc.setFont("helvetica", "normal");
  doc.text(formatCurrency(invoiceData.subtotal), 160, finalY + 10);
  doc.text(formatCurrency(invoiceData.ppn), 160, finalY + 15);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(29, 78, 216);
  doc.text(formatCurrency(invoiceData.total), 160, finalY + 22);

  if (invoiceData.status === "Paid") {
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(24);
    doc.text("PAID", 14, finalY + 20);
  } else if (invoiceData.status === "Partially Paid" && invoiceData.amountPaid) {
    doc.setTextColor(217, 119, 6);
    doc.setFontSize(14);
    doc.text(`Paid: ${formatCurrency(invoiceData.amountPaid)}`, 14, finalY + 20);
    doc.text(`Due: ${formatCurrency(invoiceData.total - invoiceData.amountPaid)}`, 14, finalY + 26);
  }

  doc.setTextColor(100);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Please make payment to:", 14, finalY + 40);
  doc.text("Bank Mandiri: 123-456-7890 a/n PT. Manggala Utama Indonesia", 14, finalY + 45);

  doc.save(`${invoiceData.id}.pdf`);
};

export const generateKwitansiPDF = (paymentData: ReceiptPdfData) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [148, 210],
  });

  const amountInWords = toWordsId(paymentData.amount);
  const receiptNumber = `KWT-${paymentData.id}`;
  const today = format(new Date(), "dd MMMM yyyy");
  const companyName = paymentData.companyName || "PT. Manggala Utama Indonesia";
  const companyEmail = paymentData.companyEmail || "admin@manggala-utama.id";
  const companyPhone = paymentData.companyPhone || "+62 878-8424-1703";
  const companyAddress = paymentData.companyAddress || "Jakarta";
  const signatoryName = paymentData.signatoryName || "Muhammad Hidayat";
  const signatoryTitle = paymentData.signatoryTitle || "Direktur";

  const dottedLine = (x1: number, x2: number, y: number) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    for (let x = x1; x < x2; x += 2.2) {
      doc.line(x, y, Math.min(x + 1, x2), y);
    }
  };

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 148, "F");

  doc.setFillColor(19, 70, 122);
  doc.rect(0, 0, 210, 8, "F");
  doc.setFillColor(47, 128, 237);
  doc.rect(0, 8, 210, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(19, 70, 122);
  doc.setFontSize(18);
  doc.text(companyName, 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  doc.setFontSize(7.2);
  doc.text("IT Solutions • Procurement • Software Development • Infrastructure", 14, 25);
  doc.text(`${companyAddress} • ${companyPhone} • ${companyEmail}`, 14, 29.5);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(14, 34, 196, 34);

  doc.setFont("times", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(15);
  doc.text("KWITANSI PEMBAYARAN", 105, 43, { align: "center" });

  const labelX = 16;
  const colonX = 45;
  const valueX = 49;
  const contentRightEdge = 136;
  const signatureX = 150;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("No. Kwitansi", labelX, 53);
  doc.text(":", colonX, 53);
  doc.setFont("helvetica", "normal");
  doc.text(receiptNumber, valueX, 53);
  dottedLine(valueX, 194, 54);

  doc.setFont("helvetica", "bold");
  doc.text("Tanggal", labelX, 60);
  doc.text(":", colonX, 60);
  doc.setFont("helvetica", "normal");
  doc.text(today, valueX, 60);
  dottedLine(valueX, 194, 61);

  doc.setFont("helvetica", "bold");
  doc.text("Telah Terima Dari", labelX, 70);

  doc.text("Nama", labelX, 78);
  doc.text(":", colonX, 78);
  doc.setFont("helvetica", "normal");
  doc.text(paymentData.client, valueX, 78);
  dottedLine(valueX, 194, 79);

  doc.setFont("helvetica", "bold");
  doc.text("Uang Sejumlah", labelX, 86);
  doc.text(":", colonX, 86);
  doc.setFont("helvetica", "normal");
  doc.text(formatCurrency(paymentData.amount), valueX, 86);
  dottedLine(valueX, 194, 87);

  doc.setFont("helvetica", "bold");
  doc.text("Terbilang", labelX, 94);
  doc.text(":", colonX, 94);
  doc.setFont("helvetica", "normal");
  doc.text(amountInWords, valueX, 94);
  dottedLine(valueX, 194, 95);

  doc.setFont("helvetica", "bold");
  doc.text("Untuk Pembayaran", labelX, 106);
  doc.text(":", colonX, 106);
  doc.setFont("helvetica", "bold");
  doc.text(paymentData.description.toUpperCase(), valueX, 106);
  dottedLine(valueX, contentRightEdge, 107);

  doc.setFont("helvetica", "normal");
  doc.text(`Nomor     : ${paymentData.id}`, labelX, 116);
  doc.text(`Tanggal   : ${today}`, labelX, 122);

  doc.setFont("helvetica", "bold");
  doc.text("Terbilang", labelX, 132);
  doc.text(":", colonX, 132);
  doc.setFont("helvetica", "normal");
  doc.text(amountInWords, valueX, 132);
  dottedLine(valueX, contentRightEdge, 133);

  doc.setFont("helvetica", "normal");
  doc.text(today, signatureX, 104);
  doc.text("Penerima,", signatureX, 111);
  doc.setFont("helvetica", "bold");
  doc.text(signatoryName, signatureX, 131);
  dottedLine(signatureX, 191, 132);
  doc.setFont("helvetica", "normal");
  doc.text(signatoryTitle, signatureX + 13, 138);

  doc.save(`Kwitansi_${paymentData.id}.pdf`);
};
