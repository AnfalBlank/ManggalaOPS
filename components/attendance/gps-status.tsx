"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2 } from "lucide-react";

interface GpsStatusProps {
  onLocationChange: (lat: number, lng: number) => void;
  officeLocations: { latitude: number; longitude: number; radiusMeters: number; name: string }[];
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function GpsStatus({ onLocationChange, officeLocations }: GpsStatusProps) {
  const [status, setStatus] = useState<"detecting" | "inside" | "outside" | "error">("detecting");
  const [distance, setDistance] = useState<number | null>(null);
  const [nearestName, setNearestName] = useState<string | null>(null);

  const detect = useCallback(() => {
    setStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onLocationChange(latitude, longitude);

        if (officeLocations.length === 0) {
          setStatus("outside");
          return;
        }

        let minDist = Infinity;
        let nearest = "";
        for (const office of officeLocations) {
          const d = haversine(latitude, longitude, office.latitude, office.longitude);
          if (d < minDist) {
            minDist = d;
            nearest = office.name;
          }
        }
        setDistance(Math.round(minDist));
        setNearestName(nearest);
        setStatus(minDist <= (officeLocations.find((o) => o.name === nearest)?.radiusMeters ?? 100) ? "inside" : "outside");
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationChange, officeLocations]);

  useEffect(() => {
    detect();
  }, [detect]);

  const config = {
    detecting: { label: "Mendeteksi lokasi...", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    inside: { label: `Di dalam area${nearestName ? ` ${nearestName}` : ""} (${distance}m)`, color: "bg-green-100 text-green-800 border-green-300" },
    outside: { label: `Di luar area${nearestName ? ` (${distance}m dari ${nearestName})` : ""}`, color: "bg-red-100 text-red-800 border-red-300" },
    error: { label: "GPS tidak tersedia", color: "bg-red-100 text-red-800 border-red-300" },
  };

  const c = config[status];

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`${c.color} text-xs px-3 py-1`}>
        {status === "detecting" ? <Loader2 className="size-3 mr-1 animate-spin" /> : <MapPin className="size-3 mr-1" />}
        {c.label}
      </Badge>
      <button onClick={detect} className="text-xs text-blue-600 underline">Refresh</button>
    </div>
  );
}
