"use client";

import { useState } from "react";
import { Eye, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateDeliveryOrderPDF, type DeliveryOrderPdfData } from "@/lib/delivery-order-pdf";
import { batalkanTab, siapkanTab } from "@/lib/dokumen-pdf";

export function DownloadDeliveryOrderButton({ payload }: { payload: DeliveryOrderPdfData }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-3"
      disabled={loading}
      onClick={async () => {
        siapkanTab();
        try {
          setLoading(true);
          // PDF generation is sync but wrap to allow loading UX.
          await Promise.resolve().then(() => generateDeliveryOrderPDF(payload));
        } catch (error) {
          batalkanTab();
          throw error;
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Eye className="size-4 mr-2" />} Lihat PDF
    </Button>
  );
}
