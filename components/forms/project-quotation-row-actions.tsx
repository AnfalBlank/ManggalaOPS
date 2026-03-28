"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ProjectDialog, QuotationDialog } from "@/components/forms/project-quotation-dialogs";
import { Button } from "@/components/ui/button";

type ClientOption = { id: number; name: string };
type ProjectOption = { id: number; name: string };

type ProjectRow = {
  id: number;
  clientId: number;
  name: string;
  value: number;
  status: string;
  progress: number;
  deadline: string | null;
};

type QuotationRow = {
  id: number;
  clientId: number;
  projectId: number | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  validUntil: string | null;
};

export function ProjectRowActions({ project, clients }: { project: ProjectRow; clients: ClientOption[] }) {
  const router = useRouter();

  return (
    <div className="flex justify-end gap-2">
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
