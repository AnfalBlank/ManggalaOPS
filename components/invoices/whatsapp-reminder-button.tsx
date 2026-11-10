"use client";

import { useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { labelStatus } from "@/lib/label-status";
import {
  buildWhatsappReminderUrl,
  chooseReminderTone,
  composeReminderMessage,
  getReminderToneLabel,
  normalizePhoneForWhatsapp,
  type CompanyForReminder,
  type InvoiceForReminder,
  type ReminderTone,
} from "@/lib/whatsapp";

const TONES: ReminderTone[] = ["friendly", "due_soon", "overdue", "thanks_partial"];

export function WhatsappReminderButton({
  invoice,
  company,
}: {
  invoice: InvoiceForReminder;
  company: CompanyForReminder;
}) {
  const [open, setOpen] = useState(false);
  const initialTone = chooseReminderTone(invoice);
  const [tone, setTone] = useState<ReminderTone>(initialTone);
  const [message, setMessage] = useState(() => composeReminderMessage(invoice, company, initialTone));
  const [sending, setSending] = useState(false);

  const phoneOk = !!normalizePhoneForWhatsapp(invoice.clientPhone);
  const phoneDisplay = invoice.clientPhone || "(belum diisi)";
  const alreadyPaid = invoice.outstandingAmount <= 0 && invoice.total > 0;

  const onToneChange = (next: string | null) => {
    const value = next ?? "friendly";
    const safe = (TONES.includes(value as ReminderTone) ? value : "friendly") as ReminderTone;
    setTone(safe);
    setMessage(composeReminderMessage(invoice, company, safe));
  };

  const onSend = async () => {
    const phone = normalizePhoneForWhatsapp(invoice.clientPhone);
    if (!phone) {
      toast.error("Nomor HP klien belum benar. Perbaiki dulu di halaman Klien.");
      return;
    }
    try {
      setSending(true);
      // Fire-and-forget audit log; we still open WhatsApp regardless of audit success.
      if (invoice.id) {
        fetch(`/api/invoices/${invoice.id}/reminder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tone, channel: "whatsapp" }),
        }).catch(() => null);
      }
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("WhatsApp dibuka di tab baru. Tinggal klik kirim.");
      setOpen(false);
    } finally {
      setSending(false);
    }
  };

  // Hide button entirely if invoice is fully paid (no need to remind).
  if (alreadyPaid) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border-emerald-200"
            title={phoneOk ? "Kirim pengingat lewat WhatsApp" : "Nomor HP klien belum benar"}
            disabled={!phoneOk}
          >
            <MessageCircle className="size-4 mr-1" /> Ingatkan
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kirim pengingat lewat WhatsApp</DialogTitle>
          <DialogDescription>
            Pesan dibuka di WhatsApp buat dikirim ke nomor klien. Kamu bisa ubah dulu isinya sebelum kirim.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-lg border bg-muted/20 p-3 text-sm grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-muted-foreground uppercase">Tagihan</div>
              <div className="font-semibold">{invoice.code}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Status</div>
              <div className="font-semibold">{labelStatus(invoice.status)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Klien</div>
              <div className="font-semibold">{invoice.clientName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">No. HP</div>
              <div className={`font-semibold ${phoneOk ? "text-emerald-700" : "text-rose-600"}`}>{phoneDisplay}</div>
            </div>
          </div>

          {!phoneOk ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              Nomor HP klien belum diisi atau belum benar. Perbaiki dulu lewat menu <span className="font-semibold">Klien</span>.
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label>Jenis pengingat</Label>
            <Select value={tone} onValueChange={onToneChange}>
              <SelectTrigger className="w-full">
                <SelectValue>{(value: ReminderTone) => getReminderToneLabel(value)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {getReminderToneLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Jenis awal dipilih sesuai status tagihan. Ganti jenis buat bikin ulang pesannya.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Pesan</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={14}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Pesan boleh diubah sebelum dikirim. Format WhatsApp bisa dipakai (*tebal*, _miring_).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button disabled={sending || !phoneOk || !message.trim()} onClick={onSend} className="gap-2">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
            Buka di WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
