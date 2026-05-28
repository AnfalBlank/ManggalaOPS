"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function GenerateDeliveryFromInvoiceButton({ invoiceId }: { invoiceId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery-orders/from-invoice/${invoiceId}`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(payload.error ?? "Gagal generate surat jalan");
        return;
      }
      toast.success(`Surat jalan #${payload.deliveryOrderId} berhasil dibuat. Buka menu Surat Jalan untuk download PDF.`);
      router.push("/delivery-orders");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-blue-700 hover:text-blue-800"
          disabled={loading}
          title="Generate Surat Jalan dari invoice ini"
        >
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Truck className="size-4 mr-2" />} Surat Jalan
        </Button>
      }
      title="Generate surat jalan dari invoice ini?"
      description="Surat jalan baru akan dibuat dengan item & detail penerima sama dengan invoice."
      confirmText="Generate"
      onConfirm={onConfirm}
    />
  );
}
