"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateQuotationPDF, type QuotationPdfData } from "@/lib/quotation-pdf";

export function DownloadQuotationButton({ payload }: { payload: QuotationPdfData }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-3"
      disabled={loading}
      onClick={async () => {
        try {
          setLoading(true);
          await generateQuotationPDF(payload);
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />} PDF
    </Button>
  );
}
