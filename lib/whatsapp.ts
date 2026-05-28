/**
 * Helpers to compose WhatsApp message links from invoice data.
 *
 * No third-party API: we open https://wa.me/<phone>?text=<encoded message>
 * from the user's browser, which works for both web WhatsApp and mobile.
 */

export type InvoiceForReminder = {
  id?: number;
  code: string;
  clientName: string;
  clientPhone?: string | null;
  total: number;
  amountPaid: number;
  outstandingAmount: number;
  dueDate: string | null;
  status: string;
  paymentMethod: string | null;
  recipientName?: string | null;
};

export type CompanyForReminder = {
  name: string;
  phone?: string | null;
  email?: string | null;
};

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

/**
 * Normalize Indonesian phone number to wa.me format (62-prefixed digits, no plus).
 * Accepts: "+62 812-3456-7890", "0812.3456-7890", "62812345...", etc.
 * Returns null if the number is invalid (too short or empty).
 */
export function normalizePhoneForWhatsapp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Strip everything except digits.
  const digits = String(raw).replace(/\D/g, "");
  if (!digits || digits.length < 8) return null;

  // Replace leading 0 with 62 (Indonesian convention).
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  // Already starts with 62 -> use as-is.
  if (digits.startsWith("62")) return digits;
  // Some users save with country code without 62 (e.g. starts with 8 directly).
  if (digits.startsWith("8")) return `62${digits}`;
  // Unknown leading digit: best effort, prepend 62.
  return digits;
}

export type ReminderTone = "friendly" | "due_soon" | "overdue" | "thanks_partial";

/**
 * Pick a default tone based on invoice status and due date.
 */
export function chooseReminderTone(invoice: InvoiceForReminder): ReminderTone {
  if (invoice.status === "Paid") return "friendly"; // shouldn't be needed but safe.
  if (invoice.amountPaid > 0 && invoice.outstandingAmount > 0) return "thanks_partial";
  if (invoice.status === "Overdue") return "overdue";

  if (invoice.dueDate) {
    const due = new Date(invoice.dueDate);
    const now = new Date();
    const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 3) return "due_soon";
  }
  return "friendly";
}

const TONE_LABELS: Record<ReminderTone, string> = {
  friendly: "Pengingat Lembut",
  due_soon: "Mendekati Jatuh Tempo",
  overdue: "Lewat Jatuh Tempo",
  thanks_partial: "Terima Kasih + Sisa",
};

export function getReminderToneLabel(tone: ReminderTone): string {
  return TONE_LABELS[tone];
}

const formatDate = (iso: string | null) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
};

/**
 * Compose the reminder message body. Returns plain text suitable for url-encoding.
 */
export function composeReminderMessage(
  invoice: InvoiceForReminder,
  company: CompanyForReminder,
  tone: ReminderTone = chooseReminderTone(invoice),
): string {
  const greetingTarget = invoice.recipientName?.trim() || invoice.clientName;
  const dueDateLabel = formatDate(invoice.dueDate);
  const total = formatRupiah(invoice.total);
  const outstanding = formatRupiah(invoice.outstandingAmount);
  const paid = formatRupiah(invoice.amountPaid);
  const companyName = company.name || "PT. Manggala Utama Indonesia";
  const companyContact = [company.phone, company.email].filter(Boolean).join(" / ");

  const intro = (() => {
    switch (tone) {
      case "overdue":
        return `Selamat siang Bapak/Ibu ${greetingTarget},\n\nKami dari ${companyName} ingin menyampaikan bahwa invoice di bawah ini telah melewati jatuh tempo. Mohon konfirmasi terkait pembayarannya.`;
      case "due_soon":
        return `Selamat siang Bapak/Ibu ${greetingTarget},\n\nKami dari ${companyName} ingin mengingatkan bahwa invoice berikut akan segera jatuh tempo. Mohon perhatiannya untuk proses pembayaran.`;
      case "thanks_partial":
        return `Selamat siang Bapak/Ibu ${greetingTarget},\n\nTerima kasih atas pembayaran yang sudah masuk. Kami ingin menyampaikan info sisa tagihan invoice berikut.`;
      case "friendly":
      default:
        return `Selamat siang Bapak/Ibu ${greetingTarget},\n\nKami dari ${companyName} ingin mengingatkan terkait invoice tagihan berikut.`;
    }
  })();

  const detail = `*Detail Invoice*
No. Invoice : ${invoice.code}
Total       : ${total}
${invoice.amountPaid > 0 ? `Sudah Bayar : ${paid}\n` : ""}Sisa Tagihan: ${outstanding}
Jatuh Tempo : ${dueDateLabel}
Pembayaran  : ${invoice.paymentMethod || "CBD"}`;

  const closing = (() => {
    switch (tone) {
      case "overdue":
        return `Mohon konfirmasi rencana pembayaran sesegera mungkin. Bila pembayaran sudah dilakukan, mohon abaikan pesan ini dan kirim bukti transfernya kepada kami.\n\nTerima kasih atas perhatian dan kerjasamanya.`;
      case "due_soon":
        return `Bila pembayaran sudah dilakukan, mohon kirimkan bukti transfernya kepada kami.\n\nTerima kasih atas kerjasamanya.`;
      case "thanks_partial":
        return `Mohon konfirmasi terkait pelunasan sisa tagihan. Bila ada kendala, jangan sungkan untuk menghubungi kami.\n\nTerima kasih.`;
      case "friendly":
      default:
        return `Bila ada pertanyaan terkait invoice ini, kami siap membantu. Terima kasih atas perhatian dan kerjasamanya.`;
    }
  })();

  const signature = `Hormat kami,\n${companyName}${companyContact ? `\n${companyContact}` : ""}`;

  return `${intro}\n\n${detail}\n\n${closing}\n\n${signature}`;
}

/**
 * Build the wa.me URL for the given invoice + company. Returns null if phone is invalid.
 */
export function buildWhatsappReminderUrl(
  invoice: InvoiceForReminder,
  company: CompanyForReminder,
  tone?: ReminderTone,
): string | null {
  const phone = normalizePhoneForWhatsapp(invoice.clientPhone);
  if (!phone) return null;
  const message = composeReminderMessage(invoice, company, tone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
