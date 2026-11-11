import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { tampilkanPdf } from "@/lib/dokumen-pdf";

const LABEL_PENGIRIMAN_PDF: Record<string, string> = {
  "Direct Delivery": "Antar langsung",
  "Kurir Internal": "Kurir internal",
  Pickup: "Diambil sendiri",
};
function labelPengirimanPdf(method?: string | null) {
  if (!method) return "Antar langsung";
  return LABEL_PENGIRIMAN_PDF[method] ?? method;
}

export type DeliveryOrderPdfItem = {
  description: string;
  qty: number;
  unit?: string | null;
  serialNumber?: string | null;
  notes?: string | null;
};

export type DeliveryOrderPdfData = {
  id: string;
  client: string;
  project?: string | null;
  date: Date;
  invoiceCode?: string | null;
  poNumber?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  shippingMethod?: string | null;
  recipientName?: string | null;
  recipientCompany?: string | null;
  recipientAddress?: string | null;
  recipientPhone?: string | null;
  subject?: string | null;
  introduction?: string | null;
  notes?: string | null;
  closingNote?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  items: DeliveryOrderPdfItem[];
};

const toRomanMonth = (month: number) =>
  ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][month - 1] || "I";

// `id` = nomor surat tersimpan (0001/MUI/SJ/…). Kode pendek lama (SJ-0012) masih dihitung pakai rumus lama.
function buildLetterNumber(id: string, date: Date) {
  if (id.includes("/")) return id;
  const number = id.replace(/\D/g, "") || "0001";
  return `${number}/MUI/SJ/${toRomanMonth(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function drawWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 5) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

type JsPdfWithLastAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY?: number;
  };
};

/**
 * Generate a Delivery Order (Surat Jalan) PDF using the same visual style
 * as the invoice letter: blue top banner, INVOICE-style header, structured
 * recipient + meta blocks, gold-highlighted item table, and the standard
 * footer banner with page numbering.
 */
export function generateDeliveryOrderPDF(data: DeliveryOrderPdfData) {
  const doc = new jsPDF("p", "mm", "a4");
  const letterNumber = buildLetterNumber(data.id, data.date);

  const companyName = data.companyName || "PT. Manggala Utama Indonesia";
  const companyEmail = data.companyEmail || "admin@manggala-utama.id";
  const companyPhone = data.companyPhone || "+62 878-8424-1703";
  const companyAddress = data.companyAddress || "Jakarta";
  const headerTitle = "SURAT JALAN";

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
  doc.text(headerTitle, 196, 22, { align: "right" });

  doc.setDrawColor(215, 221, 228);
  doc.line(14, 40, 196, 40);

  doc.setTextColor(20, 41, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DIKIRIM KEPADA", 14, 50);
  doc.text("DETAIL PENGIRIMAN", 126, 50);

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
  if (data.recipientPhone) {
    leftY += 5;
    doc.text(data.recipientPhone, 14, leftY);
  }

  const infoX = 126;
  let infoY = 57;
  const infoRows: Array<[string, string]> = [
    ["Nomor", letterNumber],
    ["Tanggal", format(data.date, "dd MMMM yyyy", { locale: localeId })],
    ["Pengiriman", labelPengirimanPdf(data.shippingMethod)],
    ["No. Kendaraan", data.vehicleNumber || "-"],
    ["Sopir", data.driverName || "-"],
  ];
  if (data.invoiceCode) {
    infoRows.push(["No. Tagihan", data.invoiceCode]);
  }
  if (data.poNumber) {
    infoRows.push(["No. PO", data.poNumber]);
  }
  infoRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, infoX, infoY);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${value}`, infoX + 29, infoY);
    infoY += 6;
  });

  let y = Math.max(leftY + 10, infoY + 4, 92);
  y = drawWrappedText(
    doc,
    data.introduction ||
      "Bersama ini kami sampaikan pengiriman barang dengan rincian sebagai berikut. Mohon diperiksa dan ditandatangani sebagai bukti penerimaan.",
    14,
    y,
    182,
    5,
  );

  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["No", "Uraian", "Qty", "Satuan", "No. Seri", "Catatan"]],
    body: data.items.map((item, index) => [
      String(index + 1),
      item.description,
      String(item.qty),
      item.unit || "Unit",
      item.serialNumber || "-",
      item.notes || "-",
    ]),
    theme: "grid",
    margin: { bottom: 25 },
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
      1: { cellWidth: 70 },
      2: { halign: "center", cellWidth: 14 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "left", cellWidth: 38 },
      5: { halign: "left", cellWidth: 30 },
    },
  });

  let cursorY = ((doc as JsPdfWithLastAutoTable).lastAutoTable?.finalY ?? y) + 10;

  if (cursorY > 220) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("Catatan Pengiriman", 14, cursorY);
  cursorY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  cursorY = drawWrappedText(
    doc,
    data.notes ||
      "1. Barang yang sudah diterima tidak dapat dikembalikan kecuali ada perjanjian khusus.\n2. Pemeriksaan barang dilakukan saat barang diterima.\n3. Surat jalan ini sah tanpa tanda tangan basah jika dikirim secara digital.",
    14,
    cursorY,
    182,
    5,
  );

  if (data.closingNote) {
    cursorY += 4;
    if (cursorY > 240) {
      doc.addPage();
      cursorY = 20;
    }
    cursorY = drawWrappedText(doc, data.closingNote, 14, cursorY, 182, 5);
  }

  // Signature block: 3 columns - Pengirim, Driver, Penerima.
  const signatureTopY = Math.max(cursorY + 14, 220);
  let signY = signatureTopY;
  if (signY > 245) {
    doc.addPage();
    signY = 35;
  }

  const colWidth = 60;
  const colGap = 5;
  const totalWidth = colWidth * 3 + colGap * 2;
  const startX = (210 - totalWidth) / 2;

  const columns = [
    { label: "Pengirim", name: data.signatoryName || "Adiatma Pasau", title: data.signatoryTitle || "Manager Marketing" },
    { label: "Sopir", name: data.driverName || "(....................)", title: data.vehicleNumber ? `No. ${data.vehicleNumber}` : "" },
    { label: "Penerima", name: data.recipientName || data.client || "(....................)", title: data.recipientCompany || "" },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(format(data.date, "dd MMMM yyyy", { locale: localeId }), 196, signY, { align: "right" });
  signY += 6;
  columns.forEach((col, index) => {
    const x = startX + index * (colWidth + colGap);
    doc.setFont("helvetica", "bold");
    doc.text(col.label, x + colWidth / 2, signY, { align: "center" });
    doc.setDrawColor(180, 188, 196);
    doc.line(x, signY + 24, x + colWidth, signY + 24);
    doc.setFont("helvetica", "bold");
    doc.text(col.name, x + colWidth / 2, signY + 30, { align: "center" });
    if (col.title) {
      doc.setFont("helvetica", "normal");
      doc.text(col.title, x + colWidth / 2, signY + 35, { align: "center" });
    }
  });

  // Header/footer banners on every page (consistent with invoice & quotation).
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFillColor(14, 77, 146);
    doc.rect(0, 0, 210, 10, "F");

    doc.setFillColor(14, 77, 146);
    doc.rect(0, 287, 210, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${companyName}  •  ${companyEmail}  •  ${companyPhone}`, 14, 293);
    doc.text(`Halaman ${i} dari ${pageCount}`, 196, 293, { align: "right" });
  }

  tampilkanPdf(doc, `${letterNumber.replace(/\//g, "-")}.pdf`);
}
