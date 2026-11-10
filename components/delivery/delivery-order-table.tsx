"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DownloadDeliveryOrderButton } from "@/components/pdf/download-delivery-order-button";
import { DeliveryOrderDialog } from "@/components/forms/delivery-order-dialogs";
import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineStatusSelect } from "@/components/ui/inline-status-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DeliveryOrderListItem } from "@/lib/data-delivery";
import { isWithinPeriod, type FilterPeriod } from "@/lib/view-filters";

const statusOptions = [
  { label: "Semua status", value: "all" },
  { label: "Draft", value: "Draft" },
  { label: "In Transit", value: "In Transit" },
  { label: "Delivered", value: "Delivered" },
  { label: "Cancelled", value: "Cancelled" },
];

type ClientOption = { id: number; name: string };
type ProjectOption = { id: number; name: string; clientId: number; clientName: string };
type InvoiceOption = { id: number; code: string; clientId: number; clientName: string };

type DocumentSettings = {
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  defaultSignatoryName?: string | null;
  defaultSignatoryTitle?: string | null;
};

export function DeliveryOrdersTable({
  deliveries,
  clients,
  projects,
  invoices,
  settings,
  filters,
}: {
  deliveries: DeliveryOrderListItem[];
  clients: ClientOption[];
  projects: ProjectOption[];
  invoices: InvoiceOption[];
  settings: DocumentSettings;
  filters?: { initialQuery?: string; initialPeriod?: FilterPeriod; initialType?: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState(filters?.initialQuery ?? "");
  const [period, setPeriod] = useState<FilterPeriod>(filters?.initialPeriod ?? "all");
  const [type, setType] = useState(filters?.initialType ?? "all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setQuery(filters?.initialQuery ?? "");
    setPeriod(filters?.initialPeriod ?? "all");
    setType(filters?.initialType ?? "all");
  }, [filters?.initialPeriod, filters?.initialQuery, filters?.initialType]);

  const filtered = useMemo(
    () => deliveries.filter((delivery) => {
      const haystack = `${delivery.code} ${delivery.clientName} ${delivery.projectName ?? ""} ${delivery.recipientName ?? ""} ${delivery.invoiceCode ?? ""}`.toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesPeriod = isWithinPeriod(delivery.date, period);
      const matchesType = type === "all" || delivery.status === type;
      return matchesQuery && matchesPeriod && matchesType;
    }),
    [deliveries, period, query, type],
  );

  return (
    <div className="space-y-4">
      <TableFilterBar
        value={query}
        onChange={setQuery}
        placeholder="Cari surat jalan..."
        periodValue={period}
        onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
        typeValue={type}
        onTypeChange={setType}
        typeOptions={statusOptions}
      />

      <div className="w-full overflow-x-auto pb-4 rounded-xl border">
        <Table className="min-w-[1000px]">
          <TableHeader className="bg-slate-50 sticky top-0 z-10">
            <TableRow>
              <TableHead>No. Surat Jalan</TableHead>
              <TableHead>Client / Project</TableHead>
              <TableHead>Penerima</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pengiriman</TableHead>
              <TableHead>Ref. Invoice</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell className="font-medium">{delivery.code}</TableCell>
                <TableCell>
                  {delivery.clientName}
                  <div className="text-xs text-muted-foreground">{delivery.projectName ?? "-"}</div>
                </TableCell>
                <TableCell>
                  {delivery.recipientName ?? delivery.clientName}
                  <div className="text-xs text-muted-foreground">{delivery.recipientCompany ?? "-"}</div>
                </TableCell>
                <TableCell>{delivery.date ? format(new Date(delivery.date), "dd MMM yyyy") : "-"}</TableCell>
                <TableCell>
                  {delivery.shippingMethod ?? "-"}
                  {delivery.vehicleNumber ? <div className="text-xs text-muted-foreground">{delivery.vehicleNumber}</div> : null}
                </TableCell>
                <TableCell>{delivery.invoiceCode ?? "-"}</TableCell>
                <TableCell className="text-center">
                  <InlineStatusSelect
                    currentStatus={delivery.status}
                    options={["Draft", "In Transit", "Delivered", "Cancelled"]}
                    endpoint={`/api/delivery-orders/${delivery.id}/status`}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 flex-wrap">
                    <DownloadDeliveryOrderButton
                      payload={{
                        id: delivery.code,
                        client: delivery.clientName,
                        project: delivery.projectName,
                        date: delivery.date ? new Date(delivery.date) : new Date(),
                        invoiceCode: delivery.invoiceCode,
                        poNumber: delivery.poNumber,
                        vehicleNumber: delivery.vehicleNumber,
                        driverName: delivery.driverName,
                        shippingMethod: delivery.shippingMethod,
                        recipientName: delivery.recipientName,
                        recipientCompany: delivery.recipientCompany,
                        recipientAddress: delivery.recipientAddress,
                        recipientPhone: delivery.recipientPhone,
                        subject: delivery.subject,
                        introduction: delivery.introduction,
                        notes: delivery.notes,
                        closingNote: delivery.closingNote,
                        signatoryName: delivery.signatoryName ?? settings.defaultSignatoryName ?? null,
                        signatoryTitle: delivery.signatoryTitle ?? settings.defaultSignatoryTitle ?? null,
                        companyName: settings.companyName,
                        companyEmail: settings.companyEmail,
                        companyPhone: settings.companyPhone,
                        companyAddress: settings.companyAddress,
                        items: delivery.items.map((item) => ({
                          description: item.description,
                          qty: item.qty,
                          unit: item.unit,
                          serialNumber: item.serialNumber,
                          notes: item.notes,
                        })),
                      }}
                    />
                    <DeliveryOrderDialog
                      clients={clients}
                      projects={projects}
                      invoices={invoices}
                      defaultSignatoryName={settings.defaultSignatoryName}
                      defaultSignatoryTitle={settings.defaultSignatoryTitle}
                      delivery={{
                        id: delivery.id,
                        clientId: delivery.clientId,
                        projectId: delivery.projectId,
                        invoiceId: delivery.invoiceId,
                        date: delivery.date,
                        vehicleNumber: delivery.vehicleNumber,
                        driverName: delivery.driverName,
                        shippingMethod: delivery.shippingMethod,
                        recipientName: delivery.recipientName,
                        recipientCompany: delivery.recipientCompany,
                        recipientAddress: delivery.recipientAddress,
                        recipientPhone: delivery.recipientPhone,
                        subject: delivery.subject,
                        introduction: delivery.introduction,
                        notes: delivery.notes,
                        closingNote: delivery.closingNote,
                        signatoryName: delivery.signatoryName,
                        signatoryTitle: delivery.signatoryTitle,
                        status: delivery.status,
                        items: delivery.items.map((item) => ({
                          description: item.description,
                          qty: item.qty,
                          unit: item.unit ?? "Unit",
                          serialNumber: item.serialNumber,
                          notes: item.notes,
                        })),
                      }}
                    />
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-rose-600 hover:text-rose-700"
                          disabled={deletingId === delivery.id}
                        >
                          {deletingId === delivery.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        </Button>
                      }
                      title={`Hapus surat jalan ${delivery.code}?`}
                      description="Surat jalan akan dihapus permanen beserta seluruh item-nya."
                      confirmText="Hapus"
                      variant="destructive"
                      onConfirm={async () => {
                        try {
                          setDeletingId(delivery.id);
                          const response = await fetch(`/api/delivery-orders/${delivery.id}`, { method: "DELETE" });
                          const payload = await response.json().catch(() => ({}));
                          if (!response.ok) {
                            toast.error(payload.error ?? "Gagal menghapus surat jalan");
                            return;
                          }
                          toast.success("Surat jalan dihapus");
                          router.refresh();
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Tidak ada surat jalan yang cocok dengan filter.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
