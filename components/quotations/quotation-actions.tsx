"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

import Link from "next/link";

import { DownloadQuotationButton } from "@/components/pdf/download-quotation-button";
import { CatatPoDialog } from "@/components/po/po-dialogs";
import { QuotationRowActions } from "@/components/forms/project-quotation-row-actions";
import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { Badge } from "@/components/ui/badge";
import { InlineStatusSelect } from "@/components/ui/inline-status-select";
import { Pagination, paginate } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { labelStatus, namaProyek } from "@/lib/label-status";
import type { QuotationListItem } from "@/lib/types";
import { isWithinPeriod, type FilterPeriod } from "@/lib/view-filters";

const quotationStatusOptions = [
  { label: "Semua status", value: "all" },
  { label: "Draf", value: "Draft" },
  { label: "Terkirim", value: "Sent" },
  { label: "Diterima", value: "Accepted" },
  { label: "Ditolak", value: "Rejected" },
];

export function QuotationActionsTable({
  quotations,
  clients,
  projects,
  settings,
  filters,
  poByQuotation = {},
}: {
  poByQuotation?: Record<number, { id: number; poNumber: string }>;
  quotations: QuotationListItem[];
  clients: { id: number; name: string }[];
  projects: { id: number; name: string }[];
  settings: { companyName?: string | null; companyEmail?: string | null; companyPhone?: string | null; companyAddress?: string | null; defaultSignatoryName?: string | null; defaultSignatoryTitle?: string | null; signatureImageUrl?: string | null; stampImageUrl?: string | null; quotationSignatoryName?: string | null; quotationSignatoryTitle?: string | null; quotationSignatureImageUrl?: string | null };
  filters?: { initialQuery?: string; initialPeriod?: FilterPeriod; initialType?: string };
}) {
  const [query, setQuery] = useState(filters?.initialQuery ?? "");
  const [period, setPeriod] = useState<FilterPeriod>(filters?.initialPeriod ?? "all");
  const [type, setType] = useState(filters?.initialType ?? "all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setQuery(filters?.initialQuery ?? "");
    setPeriod(filters?.initialPeriod ?? "all");
    setType(filters?.initialType ?? "all");
    setPage(1);
  }, [filters?.initialPeriod, filters?.initialQuery, filters?.initialType]);

  useEffect(() => { setPage(1); }, [query, period, type, pageSize]);

  const filtered = useMemo(
    () => quotations.filter((quote) => {
      const matchesQuery = `${quote.code} ${quote.clientName} ${quote.projectName ?? ""} ${quote.status} ${labelStatus(quote.status)}`.toLowerCase().includes(query.toLowerCase());
      const matchesPeriod = isWithinPeriod(quote.date, period);
      const matchesType = type === "all" || quote.status === type;
      return matchesQuery && matchesPeriod && matchesType;
    }),
    [period, query, quotations, type],
  );

  const paged = paginate(filtered, page, pageSize);

  return (
    <div className="space-y-4">
      <TableFilterBar
        value={query}
        onChange={setQuery}
        placeholder="Cari nomor, klien, proyek..."
        periodValue={period}
        onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
        typeValue={type}
        onTypeChange={setType}
        typeOptions={quotationStatusOptions}
      />
      <div className="w-full overflow-x-auto pb-4 rounded-xl border">
        <Table className="min-w-[980px] xl:min-w-0">
          <TableHeader className="bg-slate-50 sticky top-0 z-10">
            <TableRow>
              <TableHead>No. penawaran</TableHead>
              <TableHead>Klien & proyek</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-right">Margin (%)</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>{quote.code}</TableCell>
                <TableCell>{quote.clientName}<div className="text-xs text-muted-foreground">{namaProyek(quote.projectName)}</div></TableCell>
                <TableCell>{quote.date ? format(new Date(quote.date), "dd MMM yyyy", { locale: localeId }) : "-"}<div className="text-xs text-muted-foreground">Berlaku s/d {quote.validUntil ? format(new Date(quote.validUntil), "dd MMM yyyy", { locale: localeId }) : "-"}</div></TableCell>
                <TableCell className="text-right">{formatCurrency(quote.total)}</TableCell>
                <TableCell className={cn("text-right font-medium", quote.totalMargin >= 0 ? "text-green-600" : "text-red-600")}>{formatCurrency(quote.totalMargin)}</TableCell>
                <TableCell className={cn("text-right font-medium", quote.totalMargin >= 0 ? "text-green-600" : "text-red-600")}>{quote.marginPercentage.toFixed(1)}%</TableCell>
                <TableCell className="text-center">
                  <InlineStatusSelect
                    currentStatus={quote.status}
                    options={["Draft", "Sent", "Accepted", "Rejected"]}
                    endpoint={`/api/quotations/${quote.id}/status`}
                    disabled={quote.status === "Accepted"}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 flex-wrap">
                    <DownloadQuotationButton
                      payload={{
                        id: quote.code,
                        client: quote.clientName,
                        project: namaProyek(quote.projectName),
                        date: quote.date ? new Date(quote.date) : new Date(),
                        validUntil: quote.validUntil ? new Date(quote.validUntil) : null,
                        companyName: settings.companyName,
                        companyEmail: settings.companyEmail,
                        companyPhone: settings.companyPhone,
                        companyAddress: settings.companyAddress,
                        paymentMethod: quote.paymentMethod,
                        attachment: quote.attachment,
                        subject: quote.subject,
                        recipientName: quote.recipientName,
                        recipientCompany: quote.recipientCompany,
                        recipientAddress: quote.recipientAddress,
                        introduction: quote.introduction,
                        terms: quote.terms,
                        closingNote: quote.closingNote,
                        // Penawaran selalu atas nama penanda tangan penawaran (marketing) + tanda tangannya.
                        signatoryName: settings.quotationSignatoryName || "Adiatma Pasau",
                        signatoryTitle: settings.quotationSignatoryTitle || "Manager Marketing",
                        signatureImageUrl: settings.quotationSignatureImageUrl ?? null,
                        stampImageUrl: null,
                        items: quote.items,
                        subtotal: quote.subtotal,
                        ppn: quote.tax,
                        total: quote.total,
                        status: quote.status,
                      }}
                    />
                    {poByQuotation[quote.id] ? (
                      <Link href={`/po/${poByQuotation[quote.id].id}`} className="inline-flex min-h-10 sm:min-h-0 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                        PO {poByQuotation[quote.id].poNumber}
                      </Link>
                    ) : quote.status !== "Rejected" ? (
                      <CatatPoDialog
                        terpilih={quote.id}
                        penawaran={[{ id: quote.id, code: quote.code, clientName: quote.clientName, subject: quote.subject, total: quote.total ?? 0, status: quote.status }]}
                        tombol={<button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white">Catat PO klien</button>}
                      />
                    ) : null}
                    <QuotationRowActions quotation={quote} clients={clients} projects={projects} />
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
