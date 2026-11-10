"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Activity, Briefcase, CheckCircle, Wallet } from "lucide-react";

import { ClickableStatCard } from "@/components/cards/clickable-stat-card";
import { ProjectRowActions } from "@/components/forms/project-quotation-row-actions";
import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { InlineStatusSelect } from "@/components/ui/inline-status-select";
import { Pagination, paginate } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { labelStatus, namaProyek } from "@/lib/label-status";
import type { ProjectListItem } from "@/lib/types";
import { isWithinPeriod, type FilterPeriod } from "@/lib/view-filters";

const projectStatusOptions = [
  { label: "Semua status", value: "all" },
  { label: labelStatus("In Progress"), value: "In Progress" },
  { label: labelStatus("Completed"), value: "Completed" },
  { label: labelStatus("On Hold"), value: "On Hold" },
];

export function ProjectsOverview({
  projects,
  clients,
  filters,
}: {
  projects: ProjectListItem[];
  clients: { id: number; name: string }[];
  filters?: { initialQuery?: string; initialPeriod?: FilterPeriod; initialType?: string };
}) {
  const [query, setQuery] = useState(filters?.initialQuery ?? "");
  const [period, setPeriod] = useState<FilterPeriod>(filters?.initialPeriod ?? "all");
  const [type, setType] = useState(filters?.initialType ?? "all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setQuery(filters?.initialQuery ?? "");
    setPeriod(filters?.initialPeriod ?? "all");
    setType(filters?.initialType ?? "all");
    setPage(1);
  }, [filters?.initialPeriod, filters?.initialQuery, filters?.initialType]);

  useEffect(() => { setPage(1); }, [query, period, type, sort, pageSize]);

  const filtered = useMemo(
    () => {
      const searched = projects.filter((project) => {
        const matchesQuery = `${project.code} ${project.name} ${project.clientName} ${project.status} ${labelStatus(project.status)}`.toLowerCase().includes(query.toLowerCase());
        const matchesPeriod = isWithinPeriod(project.startDate ?? project.deadline, period);
        const matchesType = type === "all" || project.status === type;
        return matchesQuery && matchesPeriod && matchesType;
      });
      return [...searched].sort((a, b) => sort === "newest" ? b.id - a.id : a.id - b.id);
    },
    [period, projects, query, type, sort],
  );

  const paged = paginate(filtered, page, pageSize);

  const totalProjects = projects.length;
  const completedProjects = projects.filter((project) => project.status === "Completed").length;
  const inProgressProjects = projects.filter((project) => project.status === "In Progress").length;
  const totalValue = projects.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ClickableStatCard href="/projects" title="Semua proyek" value={totalProjects} hint="Lihat semua proyek" icon={<Briefcase className="size-5" />} accentClassName="bg-blue-50 text-blue-600" />
        <ClickableStatCard href="/projects?type=In%20Progress" title="Berjalan" value={inProgressProjects} hint="Proyek yang lagi jalan" icon={<Activity className="size-5" />} accentClassName="bg-amber-50 text-amber-600" />
        <ClickableStatCard href="/projects?type=Completed" title="Selesai" value={completedProjects} hint="Proyek yang udah selesai" icon={<CheckCircle className="size-5" />} accentClassName="bg-emerald-50 text-emerald-600" />
        <ClickableStatCard href="/projects?period=year" title="Nilai kontrak" value={formatCurrency(totalValue)} hint="Total nilai semua proyek" icon={<Wallet className="size-5" />} accentClassName="bg-purple-50 text-purple-600" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-1">
            <TableFilterBar
              value={query}
              onChange={setQuery}
              placeholder="Cari proyek, klien, kode..."
              periodValue={period}
              onPeriodChange={(value) => setPeriod(value as FilterPeriod)}
              typeValue={type}
              onTypeChange={setType}
              typeOptions={projectStatusOptions}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full sm:w-36"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>

        <div className="w-full overflow-x-auto pb-4 rounded-xl border max-md:border-0 max-md:pb-0">
          <Table className="min-w-[900px] xl:min-w-0">
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px] rounded-tl-xl text-xs uppercase tracking-wider">Kode</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Nama proyek</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Klien</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Jadwal</TableHead>
                <TableHead className="w-[150px] text-xs uppercase tracking-wider">Progres</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">Nilai kontrak</TableHead>
                <TableHead className="text-center text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right rounded-tr-xl">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((project) => (
                <TableRow key={project.id} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                  <TableCell className="font-medium text-muted-foreground py-4">{project.code}</TableCell>
                  <TableCell className="font-semibold text-foreground py-4 max-w-[200px] truncate max-md:max-w-none" title={project.name}>{namaProyek(project.name)}</TableCell>
                  <TableCell className="py-4 text-sm text-slate-700">{project.clientName}</TableCell>
                  <TableCell className="text-xs py-4 text-muted-foreground">
                    <div className="flex flex-col gap-1">
                      <span>Mulai: {project.startDate ? format(new Date(project.startDate), "dd MMM yyyy", { locale: localeId }) : "-"}</span>
                      <span>Target: {project.deadline ? format(new Date(project.deadline), "dd MMM yyyy", { locale: localeId }) : "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex w-32 flex-col gap-1 md:w-auto">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${project.progress === 100 ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium py-4">{formatCurrency(project.value)}</TableCell>
                  <TableCell className="text-center py-4">
                    <InlineStatusSelect
                      currentStatus={project.status}
                      options={["In Progress", "Completed", "On Hold"]}
                      endpoint={`/api/projects/${project.id}/status`}
                    />
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <ProjectRowActions project={project} clients={clients} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>
    </>
  );
}
