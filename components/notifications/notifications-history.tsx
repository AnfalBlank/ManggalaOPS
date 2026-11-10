"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { isiNotifikasi, judulNotifikasi } from "@/lib/label-status";
import { Bell, CheckCheck, MailOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state";

type NotificationItem = {
  id: number;
  title: string;
  message?: string | null;
  type?: string | null;
  isRead?: boolean;
  createdAt?: string | null;
};

const typeStyles: Record<string, string> = {
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  error: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function NotificationsHistory({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);

  const unread = items.filter((item) => !item.isRead).length;

  const onMarkAll = async () => {
    try {
      setMarking(true);
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" }),
      });
      router.refresh();
    } finally {
      setMarking(false);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="Belum ada notifikasi"
        description="Notifikasi muncul kalau ada tagihan baru, pembayaran masuk, PO klien, atau surat jalan."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? <><span className="font-semibold text-foreground">{unread}</span> belum dibaca</> : "Semua sudah dibaca"}
        </p>
        {unread > 0 ? (
          <Button variant="outline" size="sm" disabled={marking} onClick={onMarkAll}>
            <CheckCheck className="size-4 mr-2" /> Tandai semua sudah dibaca
          </Button>
        ) : null}
      </div>

      <div className="rounded-2xl border bg-white divide-y">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-4 p-4 ${item.isRead ? "" : "bg-blue-50/30"}`}
          >
            <div
              className={`shrink-0 mt-0.5 size-9 rounded-full flex items-center justify-center ring-1 ${
                typeStyles[item.type ?? "info"] ?? typeStyles.info
              }`}
            >
              {item.isRead ? <MailOpen className="size-4" /> : <Bell className="size-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-3">
                <span className={`text-sm ${item.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>
                  {judulNotifikasi(item.title)}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {item.createdAt ? format(new Date(item.createdAt), "dd MMM yyyy HH:mm", { locale: localeId }) : "-"}
                </span>
              </div>
              {item.message ? (
                <p className="text-sm text-muted-foreground mt-1">{isiNotifikasi(item.message)}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
