"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

import { DownloadQuotationButton } from "@/components/pdf/download-quotation-button";
import { QuotationRowActions } from "@/components/forms/project-quotation-row-actions";
import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { QuotationListItem } from "@/lib/types";
import { isWithinPeriod, type FilterPeriod } from "@/lib/view-filters";

const quotationStatusOptions = [
  { label: "Semua status", value: "all" },
  { label: "Draft", value: "Draft" },
  { label: "Sent", value: "Sent" },
  { label: "Accepted", value: "Accepted" },
  { label: "Rejected", value: "Rejected" },
];

export function QuotationActionsTable({
  quotations,
  clients,
  projects,
  settings,
  filters,
}: {
  quotations: QuotationListItem[];
  clients: { id: number; name: string }[];
  projects: { id: number; name: string }[];
  settings: { companyName?: string | null; companyEmail?: string | null; companyPhone?: string | null; companyAddress?: string | null; defaultSignatoryName?: string | null; defaultSignatoryTitle?: string | null };
  filters?: { initialQuery?: string; initialPeriod?: FilterPeriod; initialType?: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState(filters?.initialQuery ?? "");
  const [period, setPeriod] = useState<FilterPeriod>(filters?.initialPeriod ?? "all");
  const [type, setType] = useState(filters?.initialType ?? "all");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    setQuery(filters?.initialQuery ?? "");
    setPeriod(filters?.initialPeriod ?? "all");
    setType(filters?.initialType ?? "all");
  }, [filters?.initialPeriod, filters?.initialQuery, filters?.initialType]);

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
                  <div className="flex justify-end gap-2 flex-wrap">
                    <DownloadQuotationButton
                      payload={{
                        id: quote.code,
                        client: quote.clientName,
                        project: quote.projectName ?? "-",
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
                        signatoryName: quote.signatoryName || settings.defaultSignatoryName,
                        signatoryTitle: quote.signatoryTitle || settings.defaultSignatoryTitle,
                        items: quote.items,
                        subtotal: quote.subtotal,
                        ppn: quote.tax,
                        total: quote.total,
                        status: quote.status,
                      }}
                    />
                    {quote.status !== "Accepted" ? (
                      <button
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        disabled={loadingId === quote.id}
                        onClick={async () => {
                          setLoadingId(quote.id);
                          try {
                            const response = await fetch(`/api/quotations/${quote.id}/accept`, { method: "POST" });
                            const payload = await response.json();
                            if (!response.ok) {
                              toast.error(payload.error ?? "Gagal accept quotation");
                              return;
                            }
                            toast.success(`Quotation accepted. Project #${payload.projectId} & Invoice #${payload.invoiceId} dibuat.`);
                            router.refresh();
                          } finally {
                            setLoadingId(null);
                          }
                        }}
                      >
                        {loadingId === quote.id ? "Processing..." : "Accept + Create"}
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">Synced</span>
                    )}
                    <QuotationRowActions quotation={quote} clients={clients} projects={projects} />
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
