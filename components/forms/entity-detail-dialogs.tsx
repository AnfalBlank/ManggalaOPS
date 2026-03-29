"use client";

import { format } from "date-fns";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 rounded-lg border p-3 text-sm">
      <div className="font-medium text-muted-foreground">{label}</div>
      <div className="col-span-2 text-foreground break-words">{value}</div>
    </div>
  );
}

export function DetailDialog({ title, description, rows }: { title: string; description: string; rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm">Detail</Button>} />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {rows.map((row) => <DetailRow key={row.label} label={row.label} value={row.value} />)}
        </div>
        <DialogFooter>
          <Button variant="outline">Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function formatDateSafe(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : format(date, "dd MMM yyyy");
}

export { formatCurrency };
