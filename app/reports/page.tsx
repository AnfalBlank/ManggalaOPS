"use client";

import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, subMonths } from "date-fns";
import { FileSpreadsheet, FileText, Briefcase, BarChart3, Calculator, PiggyBank } from "lucide-react";
import { motion } from "framer-motion";

export default function ReportsPage() {
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const lastMonthDate = format(subMonths(new Date(), 1), "yyyy-MM-dd");

  const reports = [
    {
      id: "finance",
      title: "Financial Statements",
      description: "Generate Profit & Loss, Balance Sheet, and Cash Flow assertions.",
      icon: Calculator,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      id: "sales",
      title: "Sales & Revenue",
      description: "Detailed breakdown of won leads, generated invoices, and collected payments.",
      icon: BarChart3,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      id: "projects",
      title: "Project Operations",
      description: "Status reports of ongoing implementations and procurement fulfillment.",
      icon: Briefcase,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      id: "tax",
      title: "Tax & Compliance",
      description: "PPN (Value Added Tax) collected and owing liabilities report.",
      icon: PiggyBank,
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ];

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Reports Center</h1>
          <p className="text-muted-foreground mt-1">Generate and export comprehensive analytics and statements.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {reports.map((report, idx) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${report.id}-start`} className="text-xs text-slate-500">Start Date</Label>
                      <Input id={`${report.id}-start`} type="date" defaultValue={lastMonthDate} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${report.id}-end`} className="text-xs text-slate-500">End Date</Label>
                      <Input id={`${report.id}-end`} type="date" defaultValue={currentDate} className="h-9 text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" className="flex-1 gap-2 border-slate-200 hover:bg-slate-50 text-slate-600">
                      <FileText className="size-4" /> Export PDF
                    </Button>
                    <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                      <FileSpreadsheet className="size-4" /> Export Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </PageWrapper>
  );
}
