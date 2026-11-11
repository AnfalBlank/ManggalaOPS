"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { WhatsappReminderButton } from "@/components/invoices/whatsapp-reminder-button";
import { DownloadInvoiceLetterButton } from "@/components/pdf/download-invoice-letter-button";
import { DownloadKwitansiButton } from "@/components/pdf/download-kwitansi-button";
import { GenerateDeliveryFromInvoiceButton } from "@/components/pdf/generate-delivery-from-invoice-button";
import { Badge } from "@/components/ui/badge";
import { InlineStatusSelect } from "@/components/ui/inline-status-select";
import { Pagination, paginate } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadRowActions } from "@/components/forms/lead-row-actions";
import { InvoiceRowActions, PaymentRowActions } from "@/components/forms/invoice-payment-row-actions";
import { formatCurrency } from "@/lib/format";

const tgl = (d: string | Date | null | undefined) => (d ? format(new Date(d), "dd MMM yyyy", { locale: localeId }) : "-");
import type { InvoiceListItem, LeadListItem, PaymentListItem } from "@/lib/types";
import { labelStatus, namaProyek } from "@/lib/label-status";
import { isWithinPeriod, type FilterPeriod } from "@/lib/view-filters";

type ClientOption = { id: number; name: string };
type InvoiceOption = { id: number; code: string };
type DocumentSettings = { companyName?: string | null; companyEmail?: string | null; companyPhone?: string | null; companyAddress?: string | null; defaultSignatoryName?: string | null; defaultSignatoryTitle?: string | null; signatureImageUrl?: string | null; stampImageUrl?: string | null };

type TableFilterState = {
  initialQuery?: string;
  initialPeriod?: FilterPeriod;
  initialType?: string;
};

function useFilterState(filters?: TableFilterState) {
  const [query, setQuery] = useState(filters?.initialQuery ?? "");
  const [period, setPeriod] = useState<FilterPeriod>(filters?.initialPeriod ?? "all");
  const [type, setType] = useState(filters?.initialType ?? "all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    setQuery(filters?.initialQuery ?? "");
    setPeriod(filters?.initialPeriod ?? "all");
    setType(filters?.initialType ?? "all");
    setPage(1);
  }, [filters?.initialPeriod, filters?.initialQuery, filters?.initialType]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [query, period, type, pageSize, sort]);

  return { query, setQuery, period, setPeriod, type, setType, page, setPage, pageSize, setPageSize, sort, setSort };
}

const leadStatusOptions = [
  { label: "Semua status", value: "all" },
  { label: labelStatus("New"), value: "New" },
  { label: labelStatus("Follow Up"), value: "Follow Up" },
  { label: labelStatus("Negotiation"), value: "Negotiation" },
  { label: labelStatus("Won"), value: "Won" },
  { label: labelStatus("Lost"), value: "Lost" },
];

const invoiceStatusOptions = [
  { label: "Semua status", value: "all" },
  { label: labelStatus("Unpaid"), value: "Unpaid" },
  { label: labelStatus("Partially Paid"), value: "Partially Paid" },
  { label: labelStatus("Paid"), value: "Paid" },
  { label: labelStatus("Overdue"), value: "Overdue" },
];

const LABEL_CARA_BAYAR: Record<string, string> = { Cash: "Tunai", Term: "Tempo" };
const labelCaraBayar = (m?: string | null) => (m ? LABEL_CARA_BAYAR[m] ?? m : "-");

const paymentMethodOptions = [
  { label: "Semua metode", value: "all" },
  { label: "Transfer", value: "Transfer" },
  { label: "Tunai", value: "Cash" },
  { label: "Giro", value: "Giro" },
  { label: "CBD", value: "CBD" },
  { label: "Tempo", value: "Term" },
];


export function FilterableLeadsTable({ leads, clients, filters }: { leads: LeadListItem[]; clients: ClientOption[]; filters?: TableFilterState }) {
  const { query, setQuery, period, setPeriod, type, setType, page, setPage, pageSize, setPageSize, sort, setSort } = useFilterState(filters);

  const filtered = useMemo(
    () => {
      const searched = leads.filter((lead) => {
        const matchesQuery = `${lead.code} ${lead.clientName} ${lead.serviceName} ${lead.status} ${labelStatus(lead.status)}`.toLowerCase().includes(query.toLowerCase());
        const matchesPeriod = isWithinPeriod(lead.createdAt, period);
        const matchesType = type === "all" || lead.status === type;
        return matchesQuery && matchesPeriod && matchesType;
      });
      return [...searched].sort((a, b) => sort === "newest" ? b.id - a.id : a.id - b.id);
    },
    [leads, period, query, type, sort],
  );

  const paged = paginate(filtered, page, pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <TableFilterBar
            value={query}
            onChange={setQuery}
            placeholder="Cari calon klien..."
            periodValue={period}
            onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
            typeValue={type}
            onTypeChange={setType}
            typeOptions={leadStatusOptions}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full sm:w-36"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
        </select>
      </div>
      <div className="w-full overflow-x-auto pb-4 md:rounded-xl md:border">
        <Table className="min-w-[880px] xl:min-w-0">
          <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead>No.</TableHead>
              <TableHead>Klien</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Kebutuhan</TableHead>
              <TableHead className="text-right">Perkiraan nilai</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{lead.code}</TableCell>
                <TableCell>{lead.clientName}</TableCell>
                <TableCell>{lead.contactPerson ?? "-"}</TableCell>
                <TableCell>{lead.serviceName}</TableCell>
                <TableCell className="text-right">{formatCurrency(lead.estimatedValue)}</TableCell>
                <TableCell className="text-center">
                  <InlineStatusSelect
                    currentStatus={lead.status}
                    options={["New", "Follow Up", "Negotiation", "Won", "Lost"]}
                    endpoint={`/api/leads/${lead.id}/status`}
                  />
                </TableCell>
                <TableCell className="text-right">{tgl(lead.createdAt)}</TableCell>
                <TableCell className="text-right"><LeadRowActions row={lead} clients={clients} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}

export function FilterableInvoicesTable({ invoices, clients, settings, filters }: { invoices: InvoiceListItem[]; clients: ClientOption[]; settings: DocumentSettings; filters?: TableFilterState }) {
  const { query, setQuery, period, setPeriod, type, setType, page, setPage, pageSize, setPageSize, sort, setSort } = useFilterState(filters);

  const filtered = useMemo(
    () => {
      const searched = invoices.filter((invoice) => {
        const matchesQuery = `${invoice.code} ${invoice.kodeLama ?? ""} ${invoice.clientName} ${invoice.projectName ?? ""} ${invoice.status} ${labelStatus(invoice.status)}`.toLowerCase().includes(query.toLowerCase());
        const matchesPeriod = isWithinPeriod(invoice.date, period);
        const matchesType = type === "all" || invoice.status === type;
        return matchesQuery && matchesPeriod && matchesType;
      });
      return [...searched].sort((a, b) => sort === "newest" ? b.id - a.id : a.id - b.id);
    },
    [invoices, period, query, type, sort],
  );

  const paged = paginate(filtered, page, pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <TableFilterBar
            value={query}
            onChange={setQuery}
            placeholder="Cari tagihan..."
            periodValue={period}
            onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
            typeValue={type}
            onTypeChange={setType}
            typeOptions={invoiceStatusOptions}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full sm:w-36"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
        </select>
      </div>
      <div className="w-full overflow-x-auto pb-4 md:rounded-xl md:border">
        <Table className="min-w-[980px] xl:min-w-0">
          <TableHeader className="bg-slate-50 sticky top-0 z-10">
            <TableRow>
              <TableHead>No. tagihan</TableHead>
              <TableHead>Klien & proyek</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Sudah dibayar</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.code}</TableCell>
                <TableCell>{invoice.clientName}<div className="text-xs text-muted-foreground">{namaProyek(invoice.projectName)}</div></TableCell>
                <TableCell>{tgl(invoice.date)}<div className="text-xs text-muted-foreground">Jatuh tempo {tgl(invoice.dueDate)}</div></TableCell>
                <TableCell className="text-right">{invoice.amountPaid ? formatCurrency(invoice.amountPaid) : "-"}</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                <TableCell className="text-center">
                  <Badge className={
                    invoice.status === "Paid" ? "bg-emerald-100 text-emerald-700 border-none" :
                    invoice.status === "Overdue" ? "bg-rose-100 text-rose-700 border-none" :
                    invoice.status === "Partially Paid" ? "bg-amber-100 text-amber-700 border-none" :
                    "bg-slate-100 text-slate-700 border-none"
                  }>{labelStatus(invoice.status)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <DownloadInvoiceLetterButton payload={{ id: invoice.code, client: invoice.clientName, project: namaProyek(invoice.projectName), date: invoice.date ? new Date(invoice.date) : new Date(), dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null, companyName: settings.companyName, companyEmail: settings.companyEmail, companyPhone: settings.companyPhone, companyAddress: settings.companyAddress, paymentMethod: invoice.paymentMethod, attachment: invoice.attachment, subject: invoice.subject, recipientName: invoice.recipientName, recipientCompany: invoice.recipientCompany, recipientAddress: invoice.recipientAddress, introduction: invoice.introduction, terms: invoice.terms, closingNote: invoice.closingNote, signatoryName: invoice.signatoryName || settings.defaultSignatoryName, signatoryTitle: invoice.signatoryTitle || settings.defaultSignatoryTitle, signatureImageUrl: settings.signatureImageUrl, stampImageUrl: settings.stampImageUrl, items: invoice.items, subtotal: invoice.subtotal, ppn: invoice.tax, total: invoice.total, amountPaid: invoice.amountPaid, outstandingAmount: invoice.outstandingAmount, status: invoice.status, clientPoNumber: invoice.clientPoNumber ?? null }} />
                    <GenerateDeliveryFromInvoiceButton invoiceId={invoice.id} />
                    <WhatsappReminderButton
                      invoice={{
                        id: invoice.id,
                        code: invoice.code,
                        clientName: invoice.clientName,
                        clientPhone: invoice.clientPhone,
                        total: invoice.total,
                        amountPaid: invoice.amountPaid,
                        outstandingAmount: invoice.outstandingAmount,
                        dueDate: invoice.dueDate,
                        status: invoice.status,
                        paymentMethod: invoice.paymentMethod,
                        recipientName: invoice.recipientName,
                      }}
                      company={{
                        name: settings.companyName ?? "PT. Manggala Utama Indonesia",
                        phone: settings.companyPhone,
                        email: settings.companyEmail,
                      }}
                    />
                    {invoice.amountPaid > 0 ? (
                      // Kwitansi 1 nomor per pembayaran: dicetak dari menu Pembayaran, bukan gabungan per tagihan.
                      <Link
                        href={`/payments?q=${encodeURIComponent(invoice.code)}`}
                        title="Kwitansi (per pembayaran)"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <Receipt className="size-4" />
                      </Link>
                    ) : null}
                    <InvoiceRowActions row={invoice} clients={clients} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}

export function FilterablePaymentsTable({ payments, clients, invoices, settings, filters }: { payments: PaymentListItem[]; clients: ClientOption[]; invoices: InvoiceOption[]; settings: DocumentSettings; filters?: TableFilterState }) {
  const { query, setQuery, period, setPeriod, type, setType, page, setPage, pageSize, setPageSize, sort, setSort } = useFilterState(filters);

  const filtered = useMemo(
    () => {
      const searched = payments.filter((payment) => {
        const matchesQuery = `${payment.code} ${payment.kodeLama ?? ""} ${payment.clientName} ${payment.invoiceCode} ${payment.invoiceKodeLama ?? ""} ${payment.paymentMethod ?? ""}`.toLowerCase().includes(query.toLowerCase());
        const matchesPeriod = isWithinPeriod(payment.date, period);
        const matchesType = type === "all" || (payment.paymentMethod ?? "").toLowerCase() === type.toLowerCase();
        return matchesQuery && matchesPeriod && matchesType;
      });
      return [...searched].sort((a, b) => sort === "newest" ? b.id - a.id : a.id - b.id);
    },
    [payments, period, query, type, sort],
  );

  const paged = paginate(filtered, page, pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <TableFilterBar
            value={query}
            onChange={setQuery}
            placeholder="Cari pembayaran..."
            periodValue={period}
            onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
            typeValue={type}
            onTypeChange={setType}
            typeOptions={paymentMethodOptions}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full sm:w-36"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
        </select>
      </div>
      <div className="w-full overflow-x-auto pb-4 md:rounded-xl md:border">
        <Table className="min-w-[920px] xl:min-w-0">
          <TableHeader className="bg-slate-50 sticky top-0 z-10">
            <TableRow>
              <TableHead>No. kwitansi</TableHead>
              <TableHead>Klien</TableHead>
              <TableHead>Tagihan</TableHead>
              <TableHead>Cara bayar</TableHead>
              <TableHead>Masuk ke akun</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="text-right">Tanggal</TableHead>
              <TableHead className="text-center">Kwitansi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.code}</TableCell>
                <TableCell>{payment.clientName}</TableCell>
                <TableCell>{payment.invoiceCode}</TableCell>
                <TableCell>{labelCaraBayar(payment.paymentMethod)}</TableCell>
                <TableCell>{payment.paymentAccountCode ?? "-"}</TableCell>
                <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                <TableCell className="text-right">{tgl(payment.date)}</TableCell>
                <TableCell className="text-center"><DownloadKwitansiButton payload={{ id: payment.code, client: payment.clientName, amount: payment.amount, description: `Pembayaran tagihan ${payment.invoiceCode}`, companyName: settings.companyName, companyEmail: settings.companyEmail, companyPhone: settings.companyPhone, companyAddress: settings.companyAddress, signatoryName: settings.defaultSignatoryName, signatoryTitle: settings.defaultSignatoryTitle, signatureImageUrl: settings.signatureImageUrl, stampImageUrl: settings.stampImageUrl }} /></TableCell>
                <TableCell className="text-right"><PaymentRowActions row={payment} clients={clients} invoices={invoices} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}
