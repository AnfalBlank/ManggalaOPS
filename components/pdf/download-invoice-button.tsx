"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateInvoicePDF } from "@/lib/pdf";

type InvoicePdfPayload = {
  id: string;
  client: string;
  project: string;
  date: string;
  dueDate: string;
  subtotal: number;
  ppn: number;
  total: number;
  amountPaid?: number;
  status: string;
};

export function DownloadInvoiceButton({ payload }: { payload: InvoicePdfPayload }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-8 px-0 text-slate-400 hover:text-blue-600 rounded-full bg-white shadow-sm border-slate-200"
      onClick={() =>
        generateInvoicePDF({
          ...payload,
          project: payload.project || "-",
          date: new Date(payload.date),
          dueDate: new Date(payload.dueDate),
        })
      }
      title="Download Invoice PDF"
    >
      <Download className="size-4" />
    </Button>
  );
}
