"use client";

import { FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

type ReportRow = Record<string, string | number | null | undefined>;

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: ReportRow[]) {
  if (rows.length === 0) return "No data\n";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

function toPlainReport(title: string, rows: ReportRow[]) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const lines = [title, "", `Generated: ${new Date().toLocaleString("id-ID")}`, ""];
  if (!rows.length) return [...lines, "No data"].join("\n");
  lines.push(headers.join(" | "));
  lines.push("-".repeat(80));
  rows.forEach((row) => lines.push(headers.map((header) => String(row[header] ?? "")).join(" | ")));
  return lines.join("\n");
}

export function ExportReportButtons({ title, rows, filenamePrefix }: { title: string; rows: ReportRow[]; filenamePrefix: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Button variant="outline" className="flex-1 gap-2 border-slate-200 hover:bg-slate-50 text-slate-600" onClick={() => downloadBlob(`${filenamePrefix}.txt`, toPlainReport(title, rows), "text/plain;charset=utf-8") }>
        <FileText className="size-4" /> Export Report
      </Button>
      <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none" onClick={() => downloadBlob(`${filenamePrefix}.csv`, toCsv(rows), "text/csv;charset=utf-8") }>
        <FileSpreadsheet className="size-4" /> Export CSV
      </Button>
    </div>
  );
}
