"use client";

import { useState } from "react";
import { Loader2, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateKwitansiPDF } from "@/lib/pdf";

type ReceiptPayload = {
  id: string;
  client: string;
  amount: number;
  description: string;
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  signatureImageUrl?: string | null;
  stampImageUrl?: string | null;
};

export function DownloadKwitansiButton({ payload }: { payload: ReceiptPayload }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-8 px-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full border-emerald-200"
      disabled={loading}
      onClick={async () => {
        try {
          setLoading(true);
          await generateKwitansiPDF(payload);
        } finally {
          setLoading(false);
        }
      }}
      title="Download Kwitansi"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Receipt className="size-4" />}
    </Button>
  );
}
