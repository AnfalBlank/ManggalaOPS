import { format } from "date-fns";
import { Activity, Briefcase, CheckCircle, FolderPlus, Wallet } from "lucide-react";

import { PageWrapper } from "@/components/layout/page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProjects } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default async function ProjectsPage() {
  try {
    const projects = await getProjects();
    const totalProjects = projects.length;
    const completedProjects = projects.filter((project) => project.status === "Completed").length;
    const inProgressProjects = projects.filter((project) => project.status === "In Progress").length;
    const totalValue = projects.reduce((acc, curr) => acc + curr.value, 0);

    return (
      <PageWrapper>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Projects & Procurement</h1>
            <p className="text-muted-foreground mt-1">Track ongoing implementations and hardware procurements.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2 shadow-sm" disabled>
            <FolderPlus className="size-4" /> New Project
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Briefcase className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Projects</p>
                <h3 className="text-xl font-bold text-slate-800">{totalProjects}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Activity className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                <h3 className="text-xl font-bold text-slate-800">{inProgressProjects}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Completed</p>
                <h3 className="text-xl font-bold text-slate-800">{completedProjects}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Wallet className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Value</p>
                <h3 className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(totalValue).replace(',00', '')}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
          {projects.length === 0 ? (
            <EmptyState
              title="Belum ada data projects"
              description="Tabel projects masih kosong. Setelah lead menang atau seed dijalankan, data project akan tampil di sini."
            />
          ) : (
            <div className="w-full overflow-x-auto pb-4 rounded-xl border">
              <Table className="min-w-[900px]">
                <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px] rounded-tl-xl text-xs uppercase tracking-wider">Project ID</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Project Name</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Client</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Timeline</TableHead>
                    <TableHead className="w-[150px] text-xs uppercase tracking-wider">Progress</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider">Contract Value</TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider rounded-tr-xl">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                      <TableCell className="font-medium text-muted-foreground py-4">{project.code}</TableCell>
                      <TableCell className="font-semibold text-foreground py-4 max-w-[200px] truncate" title={project.name}>{project.name}</TableCell>
                      <TableCell className="py-4 text-sm text-slate-700">{project.clientName}</TableCell>
                      <TableCell className="text-xs py-4 text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <span>Start: {project.startDate ? format(new Date(project.startDate), "dd MMM yyyy") : "-"}</span>
                          <span>Target: {project.deadline ? format(new Date(project.deadline), "dd MMM yyyy") : "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${project.progress === 100 ? "bg-emerald-500" : "bg-primary"}`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium py-4">{formatCurrency(project.value)}</TableCell>
                      <TableCell className="text-center py-4">
                        {project.status === "Completed" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-none shadow-none">Completed</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-none shadow-none">{project.status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState
          title="Gagal memuat projects"
          description={error instanceof Error ? error.message : "Terjadi error saat membaca data project dari database."}
        />
      </PageWrapper>
    );
  }
}
