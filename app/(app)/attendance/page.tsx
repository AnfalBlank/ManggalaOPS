"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/attendance/camera-capture";
import { GpsStatus } from "@/components/attendance/gps-status";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { LogIn, LogOut, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface TodayRecord {
  id: number;
  clockIn: string | null;
  clockOut: string | null;
  status: string | null;
  clockInDistance: number | null;
}

function formatTime(ts: string | null): string {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" });
}

export default function AttendancePage() {
  const [today, setToday] = useState<TodayRecord | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [todayRes, histRes, officeRes] = await Promise.all([
      fetch("/api/attendance/today"),
      fetch(`/api/attendance?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
      fetch("/api/office-locations"),
    ]);
    setToday(await todayRes.json());
    setHistory(await histRes.json());
    setOffices(await officeRes.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setLocation({ lat, lng });
  }, []);

  const clockIn = async () => {
    if (!location) { setError("Lokasi GPS belum terdeteksi"); return; }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/attendance/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: location.lat, longitude: location.lng, photo }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(`Absen masuk berhasil! Status: ${data.status === "late" ? "Terlambat" : "Hadir"} (${data.distance}m dari ${data.officeName})`);
      fetchData();
    } catch { setError("Gagal terhubung ke server"); }
    finally { setLoading(false); }
  };

  const clockOut = async () => {
    if (!location) { setError("Lokasi GPS belum terdeteksi"); return; }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/attendance/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: location.lat, longitude: location.lng, photo }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(`Absen keluar berhasil! (${data.distance}m dari ${data.officeName})`);
      fetchData();
    } catch { setError("Gagal terhubung ke server"); }
    finally { setLoading(false); }
  };

  const now = new Date();
  const hourWIB = (now.getUTCHours() + 7) % 24;
  const minuteWIB = now.getUTCMinutes();
  const timeStr = `${String(hourWIB).padStart(2, "0")}:${String(minuteWIB).padStart(2, "0")}`;
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-lg mx-auto space-y-4 p-4 pb-20">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{timeStr}</h1>
        <p className="text-sm text-slate-500">{dateStr}</p>
      </div>

      {/* GPS Status */}
      <Card>
        <CardContent className="pt-4">
          <GpsStatus onLocationChange={handleLocationChange} officeLocations={offices} />
        </CardContent>
      </Card>

      {/* Today Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-4" /> Status Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {today?.clockIn ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-slate-500">Masuk</p>
                <p className="font-semibold">{formatTime(today.clockIn)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500">Keluar</p>
                <p className="font-semibold">{formatTime(today.clockOut)}</p>
              </div>
              <div className="col-span-2">
                <Badge className={today.status === "late" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                  {today.status === "late" ? "Terlambat" : "Hadir"}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Belum absen hari ini</p>
          )}
        </CardContent>
      </Card>

      {/* Camera */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium mb-2">Foto Selfie</p>
          <CameraCapture onCapture={setPhoto} photo={today?.clockIn && !today?.clockOut ? null : undefined} />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {!today?.clockIn && (
          <Button onClick={clockIn} disabled={loading || !location} className="h-14 text-base bg-green-600 hover:bg-green-700 col-span-2">
            <LogIn className="size-5 mr-2" /> Absen Masuk
          </Button>
        )}
        {today?.clockIn && !today?.clockOut && (
          <Button onClick={clockOut} disabled={loading || !location} className="h-14 text-base bg-red-600 hover:bg-red-700 col-span-2">
            <LogOut className="size-5 mr-2" /> Absen Keluar
          </Button>
        )}
        {today?.clockIn && today?.clockOut && (
          <div className="col-span-2 flex items-center justify-center gap-2 text-green-600 py-3">
            <CheckCircle2 className="size-5" />
            <span className="font-medium">Absensi hari ini selesai</span>
          </div>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="size-4 shrink-0" /> {error}
          </CardContent>
        </Card>
      )}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle2 className="size-4 shrink-0" /> {success}
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Riwayat Bulan Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceTable records={history} />
        </CardContent>
      </Card>
    </div>
  );
}
