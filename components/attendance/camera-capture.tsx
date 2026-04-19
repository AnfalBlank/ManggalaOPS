"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCcw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  photo?: string | null;
}

export function CameraCapture({ onCapture, photo }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured] = useState<string | null>(photo ?? null);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch {
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.");
    }
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.7);
    setCaptured(base64);
    onCapture(base64);

    // Stop camera
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStreaming(false);
  }, [onCapture]);

  const retake = useCallback(() => {
    setCaptured(null);
    startCamera();
  }, [startCamera]);

  const skip = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStreaming(false);
    setSkipped(true);
    onCapture("");
  }, [onCapture]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[4/3] max-w-sm mx-auto">
        {captured ? (
          <img src={captured} alt="Foto" className="w-full h-full object-cover" />
        ) : streaming ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : skipped ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Foto dilewati
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Camera className="size-12" />
            <span className="text-sm">Klik tombol untuk membuka kamera</span>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-2 justify-center">
        {!streaming && !captured && !skipped && (
          <Button onClick={startCamera} size="sm" variant="outline">
            <Camera className="size-4 mr-1" /> Buka Kamera
          </Button>
        )}
        {streaming && !captured && (
          <Button onClick={capture} size="sm">
            <Camera className="size-4 mr-1" /> Ambil Foto
          </Button>
        )}
        {captured && (
          <Button onClick={retake} size="sm" variant="outline">
            <RotateCcw className="size-4 mr-1" /> Ambil Ulang
          </Button>
        )}
        {!captured && (
          <Button onClick={skip} size="sm" variant="ghost">
            <X className="size-4 mr-1" /> Lewati
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
