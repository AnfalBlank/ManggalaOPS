"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateInvoiceLetterPDF, type InvoicePdfData } from "@/lib/invoice-pdf";

export function DownloadInvoiceLetterButton({ payload }: { payload: InvoicePdfData }) {
  return (
    <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => generateInvoiceLetterPDF(payload)}>
      <Download className="size-4" /> PDF
    </Button>
  );
}
