"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { OfficeLocationManager } from "@/components/attendance/office-location-manager";
import { Users, Clock, AlertTriangle, CheckCircle2, BarChart3, MapPin } from "lucide-react";

export default function AttendanceAdminPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalDays: 0, presentDays: 0, lateDays: 0 });
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [userId, setUserId] = useState("");
  const [tab, setTab] = useState<"records" | "locations">("records");

  const fetchReport = useCallback(async () => {
    const params = new URLSearchParams({ month, year });
    if (userId) params.set("userId", userId);
    const res = await fetch(`/api/attendance/report?${params}`);
    const data = await res.json();
    setRecords(data.records || []);
    setSummary(data.summary || { totalDays: 0, presentDays: 0, lateDays: 0 });
  }, [month, year, userId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Manajemen Absensi</h1>
        <div className="flex gap-2">
          <Button variant={tab === "records" ? "default" : "outline"} size="sm" onClick={() => setTab("records")}>
            <BarChart3 className="size-4 mr-1" /> Data Absensi
          </Button>
          <Button variant={tab === "locations" ? "default" : "outline"} size="sm" onClick={() => setTab("locations")}>
            <MapPin className="size-4 mr-1" /> Lokasi Kantor
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Users className="size-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{summary.totalDays}</p>
              <p className="text-xs text-slate-500">Total Record</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle2 className="size-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{summary.presentDays}</p>
              <p className="text-xs text-slate-500">Hadir</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="size-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{summary.lateDays}</p>
              <p className="text-xs text-slate-500">Terlambat</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Clock className="size-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{summary.totalDays > 0 ? Math.round((summary.presentDays / summary.totalDays) * 100) : 0}%</p>
              <p className="text-xs text-slate-500">Kehadiran</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {tab === "records" ? (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <Label className="text-xs">Bulan</Label>
                  <Input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} className="w-20" />
                </div>
                <div>
                  <Label className="text-xs">Tahun</Label>
                  <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-24" />
                </div>
                <div>
                  <Label className="text-xs">User ID</Label>
                  <Input type="number" placeholder="Semua" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-28" />
                </div>
                <Button size="sm" onClick={fetchReport}>Filter</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <AttendanceTable records={records} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <OfficeLocationManager />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
