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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Proyek</h1>
            <p className="text-muted-foreground mt-1">Pantau proyek yang lagi jalan, target selesai, dan nilai kontraknya.</p>
          </div>
          <ProjectDialog clients={clients} />
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
            <EmptyState title="Belum ada proyek" description="Proyek muncul di sini setelah penawaran diterima atau kamu bikin proyek baru." />
          </div>
        ) : (
          <ProjectsOverview projects={projects} clients={clients} filters={{ initialQuery: params.q, initialPeriod: (params.period as "all" | "30d" | "month" | "year") ?? "all", initialType: params.type ?? "all" }} />
        )}
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat proyek" description={error instanceof Error ? error.message : "Data proyek gagal dibaca. Coba muat ulang halaman."} />
      </PageWrapper>
    );
  }
}
