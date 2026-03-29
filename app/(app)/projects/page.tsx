import { ProjectDialog } from "@/components/forms/project-quotation-dialogs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ProjectsOverview } from "@/components/projects/projects-overview";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getProjects } from "@/lib/data";
import { getClientOptions } from "@/lib/options";

export default async function ProjectsPage({ searchParams }: { searchParams?: Promise<{ q?: string; period?: string; type?: string }> }) {
  try {
    const params = (await searchParams) ?? {};
    const [projects, clients] = await Promise.all([getProjects(), getClientOptions()]);

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Projects & Procurement</h1>
            <p className="text-muted-foreground mt-1">Track ongoing implementations and hardware procurements.</p>
          </div>
          <ProjectDialog clients={clients} />
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
            <EmptyState title="Belum ada data projects" description="Tabel projects masih kosong. Setelah lead menang atau seed dijalankan, data project akan tampil di sini." />
          </div>
        ) : (
          <ProjectsOverview projects={projects} clients={clients} filters={{ initialQuery: params.q, initialPeriod: (params.period as "all" | "30d" | "month" | "year") ?? "all", initialType: params.type ?? "all" }} />
        )}
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat projects" description={error instanceof Error ? error.message : "Terjadi error saat membaca data project dari database."} />
      </PageWrapper>
    );
  }
}
