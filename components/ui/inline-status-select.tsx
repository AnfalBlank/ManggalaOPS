"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { labelStatus } from "@/lib/label-status";

const STATUS_COLORS: Record<string, string> = {
  // Invoice
  Unpaid: "bg-slate-100 text-slate-700",
  "Partially Paid": "bg-amber-100 text-amber-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Overdue: "bg-rose-100 text-rose-700",
  // Quotation / Lead / Project / Delivery
  Draft: "bg-slate-100 text-slate-600",
  Sent: "bg-blue-100 text-blue-700",
  Accepted: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
  New: "bg-sky-100 text-sky-700",
  "Follow Up": "bg-violet-100 text-violet-700",
  Negotiation: "bg-amber-100 text-amber-700",
  Won: "bg-emerald-100 text-emerald-700",
  Lost: "bg-rose-100 text-rose-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  "On Hold": "bg-amber-100 text-amber-700",
  "In Transit": "bg-blue-100 text-blue-700",
  Delivered: "bg-emerald-100 text-emerald-700",
  "Dikirim ke supplier": "bg-blue-100 text-blue-700",
  "Barang diterima": "bg-emerald-100 text-emerald-700",
  Batal: "bg-rose-100 text-rose-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

type InlineStatusSelectProps = {
  currentStatus: string;
  options: string[];
  /** PATCH endpoint, e.g. "/api/quotations/5" */
  endpoint: string;
  /** Field name in PATCH body, default "status" */
  field?: string;
  /** Disable changes (e.g. Paid invoice) */
  disabled?: boolean;
};

export function InlineStatusSelect({
  currentStatus,
  options,
  endpoint,
  field = "status",
  disabled = false,
}: InlineStatusSelectProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const colorClass = STATUS_COLORS[currentStatus] ?? "bg-slate-100 text-slate-600";

  const handleChange = async (next: string | null) => {
    if (!next || next === currentStatus) return;
    try {
      setSaving(true);
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(payload.error ?? "Gagal ubah status");
        return;
      }
      toast.success(`Status diubah jadi "${labelStatus(next)}"`);
      router.refresh();
    } catch {
      toast.error("Gagal ubah status");
    } finally {
      setSaving(false);
    }
  };

  if (disabled) {
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
        {labelStatus(currentStatus)}
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      {saving ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <Select value={currentStatus} onValueChange={handleChange}>
          <SelectTrigger
            className={`h-7 rounded-full border-0 px-2.5 text-xs font-medium shadow-none focus:ring-0 ${colorClass}`}
          >
            <SelectValue>{(value: string) => labelStatus(value)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[opt] ?? "bg-slate-100"}`}>
                  {labelStatus(opt)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
