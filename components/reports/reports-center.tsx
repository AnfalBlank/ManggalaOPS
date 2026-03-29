"use client";

import { useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
import { motion } from "framer-motion";
import { Briefcase, BarChart3, Calculator, PiggyBank } from "lucide-react";

import { ExportReportButtons } from "@/components/reports/export-report-buttons";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ReportRow = Record<string, string | number | null | undefined>;

type ReportsCenterProps = {
  financeRows: ReportRow[];
  salesRows: ReportRow[];
  projectRows: ReportRow[];
  taxRows: ReportRow[];
};

function withinRange(value: string | number | null | undefined, start: string, end: string) {
  if (!value) return false;
  const date = new Date(String(value));
  const from = new Date(start);
  const to = new Date(end);
  to.setHours(23, 59, 59, 999);
  return !Number.isNaN(date.getTime()) && date >= from && date <= to;
}

export function ReportsCenter({ financeRows, salesRows, projectRows, taxRows }: ReportsCenterProps) {
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const lastMonthDate = format(subMonths(new Date(), 1), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(lastMonthDate);
  const [endDate, setEndDate] = useState(currentDate);

  const reports = useMemo(() => ([
    {
      id: "finance",
      title: "Financial Statements",
      description: "Income, expenses, and finance movements in the selected period.",
      icon: Calculator,
      color: "text-blue-600",
      bg: "bg-blue-50",
      rows: financeRows.filter((row) => withinRange(row.date, startDate, endDate)),
    },
    {
      id: "sales",
      title: "Sales & Revenue",
      description: "Won leads, invoices, and collected payments in the selected period.",
      icon: BarChart3,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      rows: salesRows.filter((row) => withinRange(row.date, startDate, endDate)),
    },
    {
      id: "projects",
      title: "Project Operations",
      description: "Project status and procurement operations in the selected period.",
      icon: Briefcase,
      color: "text-purple-600",
      bg: "bg-purple-50",
      rows: projectRows.filter((row) => withinRange(row.startDate ?? row.deadline, startDate, endDate)),
    },
    {
      id: "tax",
      title: "Tax & Compliance",
      description: "PPN from invoices and quotations in the selected period.",
      icon: PiggyBank,
      color: "text-amber-600",
      bg: "bg-amber-50",
      rows: taxRows.filter((row) => withinRange(row.date, startDate, endDate)),
    },
  ]), [endDate, financeRows, projectRows, salesRows, startDate, taxRows]);

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Reports Center</h1>
          <p className="text-muted-foreground mt-1">Generate and export analytics with real data from the selected period.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {reports.map((report, idx) => (
          <motion.div key={report.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.08 }}>
            <Card className="h-full border-border/60 hover:border-blue-200 transition-colors shadow-sm group">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`size-10 rounded-xl ${report.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <report.icon className={`size-5 ${report.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="mt-1">{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="text-sm text-muted-foreground">
                    Records in range: <span className="font-semibold text-foreground">{report.rows.length}</span>
                  </div>
                  <ExportReportButtons title={report.title} filenamePrefix={`report-${report.id}-${endDate}`} rows={report.rows} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </PageWrapper>
  );
}
