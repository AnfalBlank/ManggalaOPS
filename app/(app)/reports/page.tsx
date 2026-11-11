import { ReportsCenter, type LaporanData } from "@/components/reports/reports-center";
import { getInvoices, getLeads, getPayments, getProjects } from "@/lib/data";
import { getFinanceOverviewData } from "@/lib/admin-data";
import { getDataLaba } from "@/lib/laba-rugi-data";
import { labelKategori } from "@/lib/expense-categories";
import { labelStatus } from "@/lib/label-status";
import { getCurrentUser } from "@/lib/session-auth";

function tgl(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default async function ReportsPage() {
  const user = await getCurrentUser();
  const lihatUang = ["admin", "finance"].includes(user?.role ?? "");

  const [finance, leads, invoices, payments, projects, laba] = await Promise.all([
    lihatUang ? getFinanceOverviewData() : null,
    lihatUang ? getLeads() : [],
    lihatUang ? getInvoices() : [],
    lihatUang ? getPayments() : [],
    getProjects(),
    lihatUang ? getDataLaba() : null,
  ]);

  const laporan: LaporanData[] = [];

  if (lihatUang && finance) {
    laporan.push({
      id: "pengeluaran",
      rows: finance.recentExpenses.map((expense) => ({
        Tanggal: tgl(expense.date),
        Kategori: labelKategori(expense.category),
        Keterangan: expense.description,
        Nominal: expense.amount,
        Status: labelStatus(expense.status),
      })),
      kunciTanggal: "Tanggal",
      kunciNilai: "Nominal",
      labelNilai: "Total pengeluaran",
    });

    laporan.push({
      id: "penjualan",
      rows: [
        ...leads.map((lead) => ({ Tanggal: tgl(lead.createdAt), Jenis: "Calon klien", Nomor: lead.code, Klien: lead.clientName, Status: labelStatus(lead.status), Nilai: lead.estimatedValue })),
        ...invoices.map((invoice) => ({ Tanggal: tgl(invoice.date), Jenis: "Tagihan", Nomor: invoice.code, Klien: invoice.clientName, Status: labelStatus(invoice.status), Nilai: invoice.total })),
        ...payments.map((payment) => ({ Tanggal: tgl(payment.date), Jenis: "Pembayaran", Nomor: payment.code, Klien: payment.clientName, Status: payment.paymentMethod ?? "", Nilai: payment.amount })),
      ],
      kunciTanggal: "Tanggal",
      kunciNilai: "Nilai",
      filterNilai: { kunci: "Jenis", nilai: "Tagihan" },
      labelNilai: "Nilai tagihan terbit",
    });
  }

  laporan.push({
    id: "proyek",
    rows: projects.map((project) => ({
      Mulai: tgl(project.startDate),
      "Tenggat": tgl(project.deadline),
      Nomor: project.code,
      Proyek: project.name,
      Klien: project.clientName,
      Status: labelStatus(project.status),
      Nilai: project.value,
      "Progres (%)": project.progress,
    })),
    kunciTanggal: "Mulai",
    kunciTanggalCadangan: "Tenggat",
    kunciNilai: "Nilai",
    labelNilai: "Nilai proyek",
  });

  if (lihatUang) {
    laporan.push({
      id: "pajak",
      rows: invoices.map((invoice) => ({ Tanggal: tgl(invoice.date), Nomor: invoice.code, Klien: invoice.clientName, PPN: invoice.tax, Total: invoice.total })),
      kunciTanggal: "Tanggal",
      kunciNilai: "PPN",
      labelNilai: "Total PPN keluaran",
    });
  }

  return <ReportsCenter laporan={laporan} laba={laba} />;
}
