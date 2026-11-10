// Nilai status di database tetap bahasa Inggris (dipakai API & data lama).
// Yang tampil ke pengguna diterjemahin lewat peta ini.
export const LABEL_STATUS: Record<string, string> = {
  // Tagihan
  Unpaid: "Belum dibayar",
  "Partially Paid": "Dibayar sebagian",
  Paid: "Lunas",
  Overdue: "Telat bayar",
  // Penawaran
  Draft: "Draf",
  Sent: "Terkirim",
  Accepted: "Diterima",
  Rejected: "Ditolak",
  Expired: "Kedaluwarsa",
  // Calon klien
  New: "Baru",
  "Follow Up": "Follow up",
  Negotiation: "Negosiasi",
  Won: "Deal",
  Lost: "Gagal",
  // Proyek
  "In Progress": "Berjalan",
  Completed: "Selesai",
  "On Hold": "Ditunda",
  // Surat jalan
  "In Transit": "Dalam pengiriman",
  Delivered: "Terkirim",
  Cancelled: "Batal",
  Canceled: "Batal",
  // Pengeluaran & pembayaran
  Pending: "Menunggu",
  Approved: "Disetujui",
  Verified: "Terverifikasi",
  // Umum
  Active: "Aktif",
  Inactive: "Nonaktif",
  active: "Aktif",
  inactive: "Nonaktif",
};

export function labelStatus(status: string | null | undefined): string {
  if (!status) return "-";
  return LABEL_STATUS[status] ?? status;
}

export const LABEL_JABATAN: Record<string, string> = {
  admin: "Admin",
  finance: "Keuangan",
  sales: "Sales",
  project_manager: "Manajer proyek",
};

export function labelJabatan(role: string | null | undefined): string {
  if (!role) return "-";
  return LABEL_JABATAN[role] ?? role;
}

// Notifikasi lama tersimpan dengan judul/isi campur Inggris. Data gak diubah, cuma tampilannya.
const JUDUL_NOTIF: Record<string, string> = {
  "Quotation accepted": "Penawaran diterima",
  "Invoice baru dibuat": "Tagihan baru",
  "Expense baru dibuat": "Pengeluaran baru",
  "Payment baru tercatat": "Pembayaran masuk",
  "Reminder whatsapp terkirim": "Pengingat WhatsApp terkirim",
  "Reminder email terkirim": "Pengingat email terkirim",
};

const kode = (awalan: string, n: string) => `${awalan}-${n.padStart(4, "0")}`;

export function judulNotifikasi(judul: string): string {
  return JUDUL_NOTIF[judul] ?? judul;
}

export function isiNotifikasi(isi: string | null | undefined): string {
  if (!isi) return "-";
  return isi
    .replace(/\bQuotation #(\d+)/gi, (_, n) => kode("QUO", n))
    .replace(/\binvoice #(\d+)/gi, (_, n) => `tagihan ${kode("INV", n)}`)
    .replace(/\bproject #/gi, "proyek #")
    .replace(/berhasil diubah menjadi/g, "jadi")
    .replace(/ berhasil dibuat dengan total /g, " dibuat, total Rp ")
    .replace(/ berhasil dicatat/g, " dicatat")
    .replace(/untuk client\b/g, "untuk klien")
    .replace(/pengingat friendly/g, "pengingat ramah")
    .replace(/pengingat firm/g, "pengingat tegas")
    .replace(/pengingat final/g, "pengingat terakhir")
    .replace(/^Operational sebesar/, "Operasional sebesar")
    .replace(/ menunggu pemantauan\./, " dicatat.");
}

// Nama proyek lama yang dibikin otomatis: "Project from QUO-0012" tampil "Proyek dari QUO-0012".
export function namaProyek(nama: string | null | undefined): string {
  if (!nama) return "-";
  return nama.replace(/^Project from /, "Proyek dari ");
}
