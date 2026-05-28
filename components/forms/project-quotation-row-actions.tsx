"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DetailDialog, formatCurrency, formatDateSafe } from "@/components/forms/entity-detail-dialogs";
import { ProjectDialog, QuotationDialog } from "@/components/forms/project-quotation-dialogs";
import { ProjectDetailDialog } from "@/components/projects/project-detail-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
      toast.error(payload.error ?? "Gagal hapus project");
      return;
    }
    toast.success("Project dihapus");
    router.refresh();
  };

  return (
    <div className="flex justify-end gap-2">
      <ProjectDetailDialog projectId={project.id} />
      <ProjectDialog clients={clients} project={project} />
      <ConfirmDialog
        trigger={<Button variant="outline" size="sm" className="text-destructive"><Trash2 className="size-4" /> Delete</Button>}
        title={`Hapus project "${project.name}"?`}
        description="Project akan dihapus. Data invoice/payment yang sudah terhubung tetap aman, tapi link ke project akan kosong."
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
      toast.error(payload.error ?? "Gagal hapus quotation");
      return;
    }
    toast.success("Quotation dihapus");
    router.refresh();
  };

  return (
    <div className="flex justify-end gap-2">
      <DetailDialog
        title={`Detail Quotation #${quotation.id}`}
        description="Ringkasan lengkap data quotation"
        rows={[
          { label: "Quotation ID", value: `QUO-${String(quotation.id).padStart(4, "0")}` },
          { label: "Client", value: quotation.clientName ?? "-" },
          { label: "Project", value: quotation.projectName ?? "-" },
          { label: "Subtotal", value: formatCurrency(quotation.subtotal) },
          { label: "PPN", value: formatCurrency(quotation.tax) },
          { label: "Total", value: formatCurrency(quotation.total) },
          { label: "Status", value: quotation.status },
          { label: "Valid Until", value: formatDateSafe(quotation.validUntil) },
        ]}
      />
      <QuotationDialog clients={clients} projects={projects} quotation={quotation} />
      <ConfirmDialog
        trigger={<Button variant="outline" size="sm" className="text-destructive"><Trash2 className="size-4" /> Delete</Button>}
        title={`Hapus quotation QUO-${String(quotation.id).padStart(4, "0")}?`}
        description="Quotation akan dihapus permanen beserta seluruh item-nya."
        confirmText="Hapus"
        variant="destructive"
        onConfirm={onDelete}
      />
    </div>
  );
}
