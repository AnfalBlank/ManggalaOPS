"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DetailDialog, formatCurrency, formatDateSafe } from "@/components/forms/entity-detail-dialogs";
import { ProjectDialog, QuotationDialog } from "@/components/forms/project-quotation-dialogs";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex justify-end gap-2">
      <DetailDialog
        title={`Detail Project #${project.id}`}
        description="Ringkasan lengkap data project"
        rows={[
          { label: "Project", value: project.name },
          { label: "Client", value: project.clientName ?? "-" },
          { label: "Contract Value", value: formatCurrency(project.value) },
          { label: "Status", value: project.status },
          { label: "Progress", value: `${project.progress}%` },
          { label: "Deadline", value: formatDateSafe(project.deadline) },
        ]}
      />
      <ProjectDialog clients={clients} project={project} />
      <Button variant="outline" size="sm" className="text-destructive" onClick={async () => {
        if (!confirm(`Hapus project ${project.name}?`)) return;
        const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
        const payload = await response.json();
        if (!response.ok) {
          toast.error(payload.error ?? "Gagal hapus project");
          return;
        }
        toast.success("Project dihapus");
        router.refresh();
      }}>Delete</Button>
    </div>
  );
}

export function QuotationRowActions({ quotation, clients, projects }: { quotation: QuotationRow; clients: ClientOption[]; projects: ProjectOption[] }) {
  const router = useRouter();

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
      <Button variant="outline" size="sm" className="text-destructive" onClick={async () => {
        if (!confirm(`Hapus quotation #${quotation.id}?`)) return;
        const response = await fetch(`/api/quotations/${quotation.id}`, { method: "DELETE" });
        const payload = await response.json();
        if (!response.ok) {
          toast.error(payload.error ?? "Gagal hapus quotation");
          return;
        }
        toast.success("Quotation dihapus");
        router.refresh();
      }}>Delete</Button>
    </div>
  );
}
