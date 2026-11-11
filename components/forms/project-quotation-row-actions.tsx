"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DetailDialog, formatCurrency, formatDateSafe } from "@/components/forms/entity-detail-dialogs";
import { ProjectDialog, QuotationDialog } from "@/components/forms/project-quotation-dialogs";
import { ProjectDetailDialog } from "@/components/projects/project-detail-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { labelStatus, namaProyek } from "@/lib/label-status";

type ClientOption = { id: number; name: string };
type ProjectOption = { id: number; name: string };

type ProjectRow = {
  id: number;
  clientId: number;
  clientName?: string;
  name: string;
  value: number;
  status: string;
  progress: number;
  deadline: string | null;
};

type QuotationRow = {
  id: number;
  code: string;
  clientId: number;
  clientName?: string;
  projectId: number | null;
  projectName?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  validUntil: string | null;
  paymentMethod: string | null;
  attachment: string | null;
  subject: string | null;
  recipientName: string | null;
  recipientCompany: string | null;
  recipientAddress: string | null;
  introduction: string | null;
  terms: string | null;
  closingNote: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  items: { id: number; description: string; qty: number; unit: string | null; unitPrice: number; amount: number }[];
};

export function ProjectRowActions({ project, clients }: { project: ProjectRow; clients: ClientOption[] }) {
  const router = useRouter();

  const onDelete = async () => {
    const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? "Gagal hapus proyek");
      return;
    }
    toast.success("Proyek dihapus");
    router.refresh();
  };

  return (
    <div className="flex justify-end gap-2">
      <ProjectDetailDialog projectId={project.id} />
      <ProjectDialog clients={clients} project={project} />
      <ConfirmDialog
        trigger={<Button variant="outline" size="sm" className="text-destructive"><Trash2 className="size-4" /> Hapus</Button>}
        title={`Hapus proyek "${project.name}"?`}
        description="Proyek bakal dihapus. Tagihan & pembayaran yang nyambung tetap aman, cuma kaitannya ke proyek jadi kosong."
        confirmText="Hapus"
        variant="destructive"
        onConfirm={onDelete}
      />
    </div>
  );
}

export function QuotationRowActions({ quotation, clients, projects }: { quotation: QuotationRow; clients: ClientOption[]; projects: ProjectOption[] }) {
  const router = useRouter();

  const onDelete = async () => {
    const response = await fetch(`/api/quotations/${quotation.id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? "Gagal hapus penawaran");
      return;
    }
    toast.success("Penawaran dihapus");
    router.refresh();
  };

  return (
    <div className="flex justify-end gap-2">
      <DetailDialog
        title={`Detail penawaran ${quotation.code}`}
        description="Ringkasan data penawaran"
        rows={[
          { label: "No. penawaran", value: `${quotation.code}` },
          { label: "Klien", value: quotation.clientName ?? "-" },
          { label: "Proyek", value: namaProyek(quotation.projectName) },
          { label: "Subtotal", value: formatCurrency(quotation.subtotal) },
          { label: "PPN", value: formatCurrency(quotation.tax) },
          { label: "Total", value: formatCurrency(quotation.total) },
          { label: "Status", value: labelStatus(quotation.status) },
          { label: "Berlaku sampai", value: formatDateSafe(quotation.validUntil) },
        ]}
      />
      <QuotationDialog clients={clients} projects={projects} quotation={quotation} />
      <ConfirmDialog
        trigger={<Button variant="outline" size="sm" className="text-destructive"><Trash2 className="size-4" /> Hapus</Button>}
        title={`Hapus penawaran ${quotation.code}?`}
        description="Penawaran bakal dihapus permanen beserta semua barangnya."
        confirmText="Hapus"
        variant="destructive"
        onConfirm={onDelete}
      />
    </div>
  );
}
