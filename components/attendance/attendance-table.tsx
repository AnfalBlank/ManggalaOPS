"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AttendanceRecord {
  id: number;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string | null;
  clockInDistance: number | null;
  user?: { name: string } | null;
}

function formatTime(ts: string | null): string {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

function formatDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const statusConfig: Record<string, { label: string; color: string }> = {
  present: { label: "Hadir", color: "bg-green-100 text-green-800" },
  late: { label: "Terlambat", color: "bg-yellow-100 text-yellow-800" },
  absent: { label: "Tidak Hadir", color: "bg-red-100 text-red-800" },
};

export function AttendanceTable({ records }: { records: AttendanceRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Belum ada data absensi
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Karyawan</TableHead>
            <TableHead>Masuk</TableHead>
            <TableHead>Keluar</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Jarak</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => {
            const s = statusConfig[r.status ?? ""] ?? { label: r.status, color: "bg-slate-100 text-slate-800" };
            return (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
                <TableCell>{r.user?.name ?? "-"}</TableCell>
                <TableCell>{formatTime(r.clockIn)}</TableCell>
                <TableCell>{formatTime(r.clockOut)}</TableCell>
                <TableCell>
                  <Badge className={`${s.color} text-xs`}>{s.label}</Badge>
                </TableCell>
                <TableCell>{r.clockInDistance != null ? `${Math.round(r.clockInDistance)}m` : "-"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
