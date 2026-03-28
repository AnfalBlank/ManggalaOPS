"use client";

import { Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateKwitansiPDF } from "@/lib/pdf";

type ReceiptPayload = {
  id: string;
  client: string;
  amount: number;
  description: string;
};

export function DownloadKwitansiButton({ payload }: { payload: ReceiptPayload }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-8 px-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full border-emerald-200"
      onClick={() => generateKwitansiPDF(payload)}
      title="Download Kwitansi"
    >
      <Receipt className="size-4" />
    </Button>
  );
}
