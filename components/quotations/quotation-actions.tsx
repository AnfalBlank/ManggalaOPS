"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

import { QuotationRowActions } from "@/components/forms/project-quotation-row-actions";
import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { QuotationListItem } from "@/lib/types";
import { useMemo, useState } from "react";

export function QuotationActionsTable({ quotations, clients, projects }: { quotations: QuotationListItem[]; clients: { id: number; name: string }[]; projects: { id: number; name: string }[] }) {
  const router = useRouter();
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
                  <div className="flex justify-end gap-2">
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
