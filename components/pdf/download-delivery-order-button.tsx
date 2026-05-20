"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateDeliveryOrderPDF, type DeliveryOrderPdfData } from "@/lib/delivery-order-pdf";

export function DownloadDeliveryOrderButton({ payload }: { payload: DeliveryOrderPdfData }) {
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
          // PDF generation is sync but wrap to allow loading UX.
          await Promise.resolve().then(() => generateDeliveryOrderPDF(payload));
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />} PDF
    </Button>
  );
}
