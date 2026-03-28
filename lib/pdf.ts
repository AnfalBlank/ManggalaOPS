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
    format: "a5",
  });

  doc.setFontSize(20);
  doc.setTextColor(29, 78, 216);
  doc.setFont("helvetica", "bold");
  doc.text("KWITANSI", 20, 20);

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`No: ${paymentData.id}`, 140, 20);

  doc.setFont("helvetica", "normal");
  doc.text("Telah terima dari:", 20, 40);
  doc.setFont("helvetica", "bold");
  doc.text(paymentData.client, 60, 40);

  doc.setFont("helvetica", "normal");
  doc.text("Uang sejumlah:", 20, 50);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(paymentData.amount), 60, 50);

  doc.setFont("helvetica", "normal");
  doc.text("Untuk pembayaran:", 20, 60);
  doc.setFont("helvetica", "bold");
  doc.text(paymentData.description, 60, 60);

  doc.setFont("helvetica", "normal");
  doc.text(`Jakarta, ${format(new Date(), "dd MMMM yyyy")}`, 140, 90);
  doc.text("(................................)", 140, 120);

  doc.save(`Kwitansi_${paymentData.id}.pdf`);
};
