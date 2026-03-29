"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { DownloadInvoiceLetterButton } from "@/components/pdf/download-invoice-letter-button";
import { DownloadKwitansiButton } from "@/components/pdf/download-kwitansi-button";
import { Badge } from "@/components/ui/badge";
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
import type { InvoiceListItem, LeadListItem, PaymentListItem, QuotationListItem } from "@/lib/types";
import { isWithinPeriod, type FilterPeriod } from "@/lib/view-filters";

type ClientOption = { id: number; name: string };
type InvoiceOption = { id: number; code: string };
type DocumentSettings = { companyName?: string | null; companyEmail?: string | null; companyPhone?: string | null; companyAddress?: string | null; defaultSignatoryName?: string | null; defaultSignatoryTitle?: string | null };

type TableFilterState = {
  initialQuery?: string;
  initialPeriod?: FilterPeriod;
  initialType?: string;
};

function useFilterState(filters?: TableFilterState) {
  const [query, setQuery] = useState(filters?.initialQuery ?? "");
  const [period, setPeriod] = useState<FilterPeriod>(filters?.initialPeriod ?? "all");
  const [type, setType] = useState(filters?.initialType ?? "all");

  useEffect(() => {
    setQuery(filters?.initialQuery ?? "");
    setPeriod(filters?.initialPeriod ?? "all");
    setType(filters?.initialType ?? "all");
  }, [filters?.initialPeriod, filters?.initialQuery, filters?.initialType]);

  return { query, setQuery, period, setPeriod, type, setType };
}

const leadStatusOptions = [
  { label: "Semua status", value: "all" },
  { label: "New", value: "New" },
  { label: "Follow Up", value: "Follow Up" },
  { label: "Negotiation", value: "Negotiation" },
  { label: "Won", value: "Won" },
  { label: "Lost", value: "Lost" },
];

const invoiceStatusOptions = [
  { label: "Semua status", value: "all" },
  { label: "Unpaid", value: "Unpaid" },
  { label: "Partially Paid", value: "Partially Paid" },
  { label: "Paid", value: "Paid" },
  { label: "Overdue", value: "Overdue" },
];

const paymentMethodOptions = [
  { label: "Semua metode", value: "all" },
  { label: "Transfer", value: "Transfer" },
  { label: "Cash", value: "Cash" },
  { label: "Giro", value: "Giro" },
  { label: "CBD", value: "CBD" },
  { label: "Term", value: "Term" },
];

const quotationStatusOptions = [
  { label: "Semua status", value: "all" },
  { label: "Draft", value: "Draft" },
  { label: "Sent", value: "Sent" },
  { label: "Accepted", value: "Accepted" },
  { label: "Rejected", value: "Rejected" },
];

export function FilterableLeadsTable({ leads, clients, filters }: { leads: LeadListItem[]; clients: ClientOption[]; filters?: TableFilterState }) {
  const { query, setQuery, period, setPeriod, type, setType } = useFilterState(filters);

  const filtered = useMemo(
    () => leads.filter((lead) => {
      const matchesQuery = `${lead.code} ${lead.clientName} ${lead.serviceName} ${lead.status}`.toLowerCase().includes(query.toLowerCase());
      const matchesPeriod = isWithinPeriod(lead.createdAt, period);
      const matchesType = type === "all" || lead.status === type;
      return matchesQuery && matchesPeriod && matchesType;
    }),
    [leads, period, query, type],
  );

  return (
    <div className="space-y-4">
      <TableFilterBar
        value={query}
        onChange={setQuery}
        placeholder="Search leads..."
        periodValue={period}
        onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
        typeValue={type}
        onTypeChange={setType}
        typeOptions={leadStatusOptions}
      />
      <div className="w-full overflow-x-auto pb-4 rounded-xl border">
        <Table className="min-w-[880px]">
          <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead>Lead ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Service Need</TableHead>
              <TableHead className="text-right">Est. Value</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{lead.code}</TableCell>
                <TableCell>{lead.clientName}</TableCell>
                <TableCell>{lead.contactPerson ?? "-"}</TableCell>
                <TableCell>{lead.serviceName}</TableCell>
                <TableCell className="text-right">{formatCurrency(lead.estimatedValue)}</TableCell>
                <TableCell className="text-center"><Badge>{lead.status}</Badge></TableCell>
                <TableCell className="text-right">{lead.createdAt ? format(new Date(lead.createdAt), "dd MMM yyyy") : "-"}</TableCell>
                <TableCell className="text-right"><LeadRowActions row={lead} clients={clients} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function FilterableInvoicesTable({ invoices, clients, settings, filters }: { invoices: InvoiceListItem[]; clients: ClientOption[]; settings: DocumentSettings; filters?: TableFilterState }) {
  const { query, setQuery, period, setPeriod, type, setType } = useFilterState(filters);

  const filtered = useMemo(
    () => invoices.filter((invoice) => {
      const matchesQuery = `${invoice.code} ${invoice.clientName} ${invoice.projectName ?? ""} ${invoice.status}`.toLowerCase().includes(query.toLowerCase());
      const matchesPeriod = isWithinPeriod(invoice.date, period);
      const matchesType = type === "all" || invoice.status === type;
      return matchesQuery && matchesPeriod && matchesType;
    }),
    [invoices, period, query, type],
  );

  return (
    <div className="space-y-4">
      <TableFilterBar
        value={query}
        onChange={setQuery}
        placeholder="Search invoices..."
        periodValue={period}
        onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
        typeValue={type}
        onTypeChange={setType}
        typeOptions={invoiceStatusOptions}
      />
      <div className="w-full overflow-x-auto pb-4 rounded-xl border">
        <Table className="min-w-[980px]">
          <TableHeader className="bg-slate-50 sticky top-0 z-10">
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Client & Project</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.code}</TableCell>
                <TableCell>{invoice.clientName}<div className="text-xs text-muted-foreground">{invoice.projectName ?? "-"}</div></TableCell>
                <TableCell>{invoice.date ? format(new Date(invoice.date), "dd MMM yyyy") : "-"}<div className="text-xs text-muted-foreground">Due {invoice.dueDate ? format(new Date(invoice.dueDate), "dd MMM yyyy") : "-"}</div></TableCell>
                <TableCell className="text-right">{invoice.amountPaid ? formatCurrency(invoice.amountPaid) : "-"}</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                <TableCell className="text-center"><Badge>{invoice.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <DownloadInvoiceLetterButton payload={{ id: invoice.code, client: invoice.clientName, project: invoice.projectName ?? "-", date: invoice.date ? new Date(invoice.date) : new Date(), dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null, companyName: settings.companyName, companyEmail: settings.companyEmail, companyPhone: settings.companyPhone, companyAddress: settings.companyAddress, paymentMethod: invoice.paymentMethod, attachment: invoice.attachment, subject: invoice.subject, recipientName: invoice.recipientName, recipientCompany: invoice.recipientCompany, recipientAddress: invoice.recipientAddress, introduction: invoice.introduction, terms: invoice.terms, closingNote: invoice.closingNote, signatoryName: invoice.signatoryName || settings.defaultSignatoryName, signatoryTitle: invoice.signatoryTitle || settings.defaultSignatoryTitle, items: invoice.items, subtotal: invoice.subtotal, ppn: invoice.tax, total: invoice.total, amountPaid: invoice.amountPaid, outstandingAmount: invoice.outstandingAmount, status: invoice.status }} />
                    <InvoiceRowActions row={invoice} clients={clients} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function FilterablePaymentsTable({ payments, clients, invoices, settings, filters }: { payments: PaymentListItem[]; clients: ClientOption[]; invoices: InvoiceOption[]; settings: DocumentSettings; filters?: TableFilterState }) {
  const { query, setQuery, period, setPeriod, type, setType } = useFilterState(filters);

  const filtered = useMemo(
    () => payments.filter((payment) => {
      const matchesQuery = `${payment.code} ${payment.clientName} ${payment.invoiceCode} ${payment.paymentMethod ?? ""}`.toLowerCase().includes(query.toLowerCase());
      const matchesPeriod = isWithinPeriod(payment.date, period);
      const matchesType = type === "all" || (payment.paymentMethod ?? "").toLowerCase() === type.toLowerCase();
      return matchesQuery && matchesPeriod && matchesType;
    }),
    [payments, period, query, type],
  );

  return (
    <div className="space-y-4">
      <TableFilterBar
        value={query}
        onChange={setQuery}
        placeholder="Search payments..."
        periodValue={period}
        onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
        typeValue={type}
        onTypeChange={setType}
        typeOptions={paymentMethodOptions}
      />
      <div className="w-full overflow-x-auto pb-4 rounded-xl border">
        <Table className="min-w-[920px]">
          <TableHeader className="bg-slate-50 sticky top-0 z-10">
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Akun Masuk</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="text-center">Receipt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.code}</TableCell>
                <TableCell>{payment.clientName}</TableCell>
                <TableCell>{payment.invoiceCode}</TableCell>
                <TableCell>{payment.paymentMethod ?? "-"}</TableCell>
                <TableCell>{payment.paymentAccountCode ?? "-"}</TableCell>
                <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                <TableCell className="text-right">{payment.date ? format(new Date(payment.date), "dd MMM yyyy") : "-"}</TableCell>
                <TableCell className="text-center"><DownloadKwitansiButton payload={{ id: payment.code, client: payment.clientName, amount: payment.amount, description: `Pembayaran Invoice ${payment.invoiceCode}`, companyName: settings.companyName, companyEmail: settings.companyEmail, companyPhone: settings.companyPhone, companyAddress: settings.companyAddress, signatoryName: settings.defaultSignatoryName, signatoryTitle: settings.defaultSignatoryTitle }} /></TableCell>
                <TableCell className="text-right"><PaymentRowActions row={payment} clients={clients} invoices={invoices} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function FilterableQuotationsTable({ quotations, onAccept, filters }: { quotations: QuotationListItem[]; onAccept: (id: number) => Promise<void>; filters?: TableFilterState }) {
  const { query, setQuery, period, setPeriod, type, setType } = useFilterState(filters);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const filtered = useMemo(
    () => quotations.filter((quote) => {
      const matchesQuery = `${quote.code} ${quote.clientName} ${quote.projectName ?? ""} ${quote.status}`.toLowerCase().includes(query.toLowerCase());
      const matchesPeriod = isWithinPeriod(quote.date, period);
      const matchesType = type === "all" || quote.status === type;
      return matchesQuery && matchesPeriod && matchesType;
    }),
    [period, query, quotations, type],
  );

  return (
    <div className="space-y-4">
      <TableFilterBar
        value={query}
        onChange={setQuery}
        placeholder="Search quotations..."
        periodValue={period}
        onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
        typeValue={type}
        onTypeChange={setType}
        typeOptions={quotationStatusOptions}
      />
      <div className="w-full overflow-x-auto pb-4 rounded-xl border">
        <Table className="min-w-[980px]">
          <TableHeader className="bg-slate-50 sticky top-0 z-10">
            <TableRow>
              <TableHead>Quote ID</TableHead>
              <TableHead>Client & Project</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>{quote.code}</TableCell>
                <TableCell>{quote.clientName}<div className="text-xs text-muted-foreground">{quote.projectName ?? "-"}</div></TableCell>
                <TableCell>{quote.date ? format(new Date(quote.date), "dd MMM yyyy") : "-"}<div className="text-xs text-muted-foreground">Valid {quote.validUntil ? format(new Date(quote.validUntil), "dd MMM yyyy") : "-"}</div></TableCell>
                <TableCell className="text-right">{formatCurrency(quote.total)}</TableCell>
                <TableCell className="text-center"><Badge>{quote.status}</Badge></TableCell>
                <TableCell className="text-right">
                  {quote.status !== "Accepted" ? (
                    <button
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      disabled={loadingId === quote.id}
                      onClick={async () => {
                        setLoadingId(quote.id);
                        try { await onAccept(quote.id); } finally { setLoadingId(null); }
                      }}
                    >
                      {loadingId === quote.id ? "Processing..." : "Accept + Create"}
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium">Synced</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
