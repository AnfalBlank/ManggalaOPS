import jsPDF from "jspdf";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { drawSignatureAndStamp, preloadSignatureStamp } from "@/lib/pdf-signature";
import { tampilkanPdf } from "@/lib/dokumen-pdf";

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
  signatureImageUrl?: string | null;
  stampImageUrl?: string | null;
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

export const generateKwitansiPDF = async (paymentData: ReceiptPdfData) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [148, 210],
  });

  const sigStamp = await preloadSignatureStamp({
    signatureImageUrl: paymentData.signatureImageUrl,
    stampImageUrl: paymentData.stampImageUrl,
  });

  const amountInWords = toWordsId(paymentData.amount);
  const receiptNumber = `KWT-${paymentData.id}`;
  const today = format(new Date(), "dd MMMM yyyy", { locale: localeId });
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
  doc.text("Solusi TI • Pengadaan • Pengembangan Software • Infrastruktur", 14, 25);
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

  // Draw digital signature and stamp in the kwitansi signature area.
  drawSignatureAndStamp(doc, signatureX - 2, 113, sigStamp.signatureB64, sigStamp.stampB64);

  doc.setFont("helvetica", "bold");
  doc.text(signatoryName, signatureX, 131);
  dottedLine(signatureX, 191, 132);
  doc.setFont("helvetica", "normal");
  doc.text(signatoryTitle, signatureX + 13, 138);

  tampilkanPdf(doc, `Kwitansi_${paymentData.id}.pdf`);
};
