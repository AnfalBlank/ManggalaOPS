"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";

import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { DownloadInvoiceButton } from "@/components/pdf/download-invoice-button";
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
import { formatCurrency } from "@/lib/format";
import type { InvoiceListItem, LeadListItem, PaymentListItem, QuotationListItem } from "@/lib/types";
import { LeadRowActions, InvoiceRowActions, PaymentRowActions } from "@/components/forms/table-row-actions";

type ClientOption = { id: number; name: string };
type InvoiceOption = { id: number; code: string };

export function FilterableLeadsTable({ leads, clients }: { leads: LeadListItem[]; clients: ClientOption[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => leads.filter((lead) => `${lead.code} ${lead.clientName} ${lead.serviceName} ${lead.status}`.toLowerCase().includes(query.toLowerCase())), [leads, query]);

  return (
    <div className="space-y-4">
      <TableFilterBar value={query} onChange={setQuery} placeholder="Search leads..." />
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

export function FilterableInvoicesTable({ invoices, clients }: { invoices: InvoiceListItem[]; clients: ClientOption[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => invoices.filter((invoice) => `${invoice.code} ${invoice.clientName} ${invoice.projectName ?? ""} ${invoice.status}`.toLowerCase().includes(query.toLowerCase())), [invoices, query]);

  return (
    <div className="space-y-4">
      <TableFilterBar value={query} onChange={setQuery} placeholder="Search invoices..." />
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
                    <DownloadInvoiceButton payload={{ id: invoice.code, client: invoice.clientName, project: invoice.projectName ?? "-", date: invoice.date ?? new Date().toISOString(), dueDate: invoice.dueDate ?? new Date().toISOString(), subtotal: invoice.subtotal, ppn: invoice.tax, total: invoice.total, amountPaid: invoice.amountPaid, status: invoice.status }} />
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

export function FilterablePaymentsTable({ payments, clients, invoices }: { payments: PaymentListItem[]; clients: ClientOption[]; invoices: InvoiceOption[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => payments.filter((payment) => `${payment.code} ${payment.clientName} ${payment.invoiceCode} ${payment.paymentMethod ?? ""}`.toLowerCase().includes(query.toLowerCase())), [payments, query]);

  return (
    <div className="space-y-4">
      <TableFilterBar value={query} onChange={setQuery} placeholder="Search payments..." />
      <div className="w-full overflow-x-auto pb-4 rounded-xl border">
        <Table className="min-w-[920px]">
          <TableHeader className="bg-slate-50 sticky top-0 z-10">
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Method</TableHead>
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
                <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                <TableCell className="text-right">{payment.date ? format(new Date(payment.date), "dd MMM yyyy") : "-"}</TableCell>
                <TableCell className="text-center"><DownloadKwitansiButton payload={{ id: payment.code, client: payment.clientName, amount: payment.amount, description: `Pembayaran Invoice ${payment.invoiceCode}` }} /></TableCell>
                <TableCell className="text-right"><PaymentRowActions row={payment} clients={clients} invoices={invoices} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function FilterableQuotationsTable({ quotations, onAccept }: { quotations: QuotationListItem[]; onAccept: (id: number) => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const filtered = useMemo(() => quotations.filter((quote) => `${quote.code} ${quote.clientName} ${quote.projectName ?? ""} ${quote.status}`.toLowerCase().includes(query.toLowerCase())), [quotations, query]);

  return (
    <div className="space-y-4">
      <TableFilterBar value={query} onChange={setQuery} placeholder="Search quotations..." />
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
