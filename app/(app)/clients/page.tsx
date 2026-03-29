import { RoleGuard } from "@/components/auth/guard";
import { ClientManagement } from "@/components/clients/client-management";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ErrorState } from "@/components/ui/state";
import { getClients } from "@/lib/data";

export default async function ClientsPage() {
  try {
    const clients = await getClients();

    return (
      <PageWrapper>
        <RoleGuard allow={["admin", "sales", "finance", "project_manager"]}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Client Management</h1>
            <p className="text-muted-foreground mt-1">Kelola data client untuk kebutuhan lead, quotation, invoice, project, dan payment.</p>
          </div>
          <ClientManagement clients={clients} />
        </RoleGuard>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat clients" description={error instanceof Error ? error.message : "Terjadi error saat memuat data client."} />
      </PageWrapper>
    );
  }
}
