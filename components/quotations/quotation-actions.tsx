"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FilterableQuotationsTable } from "@/components/tables/filterable-lists";
import type { QuotationListItem } from "@/lib/types";

export function QuotationActionsTable({ quotations }: { quotations: QuotationListItem[] }) {
  const router = useRouter();

  return (
    <FilterableQuotationsTable
      quotations={quotations}
      onAccept={async (id) => {
        const response = await fetch(`/api/quotations/${id}/accept`, { method: "POST" });
        const payload = await response.json();
        if (!response.ok) {
          toast.error(payload.error ?? "Gagal accept quotation");
          return;
        }
        toast.success(`Quotation accepted. Project #${payload.projectId} & Invoice #${payload.invoiceId} dibuat.`);
        router.refresh();
      }}
    />
  );
}
