"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateQuotationPDF, type QuotationPdfData } from "@/lib/quotation-pdf";

export function DownloadQuotationButton({ payload }: { payload: QuotationPdfData }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-3"
      onClick={() => generateQuotationPDF(payload)}
    >
      <Download className="size-4" /> PDF
    </Button>
  );
}
