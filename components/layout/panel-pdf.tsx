"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, FileText, Loader2, X } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { daftarPanelPdf, EVENT_PANEL_PDF, type PesanPanelPdf } from "@/lib/dokumen-pdf";

// Browser HP (Safari iOS, Chrome Android) gak bisa nampilin PDF di dalam iframe dengan andal.
function pakaiPenampilBawaan() {
  if (typeof navigator === "undefined") return true;
  return !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

// URL blob (PDF bikinan browser) dibuang pas panel ditutup; URL file server dibiarin.
function buang(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

const isGambar = (nama: string) => /\.(jpe?g|png|webp)$/i.test(nama);

export function PanelPdf() {
  const [open, setOpen] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [berkas, setBerkas] = useState<{ url: string; filename: string } | null>(null);
  const [bisaIframe, setBisaIframe] = useState(true);
  const urlLama = useRef<string | null>(null);

  useEffect(() => {
    setBisaIframe(pakaiPenampilBawaan());
    daftarPanelPdf(true);
    const dengar = (e: Event) => {
      const pesan = (e as CustomEvent<PesanPanelPdf>).detail;
      if (pesan.status === "memuat") {
        setMemuat(true);
        setOpen(true);
      } else if (pesan.status === "batal") {
        setMemuat(false);
        if (!urlLama.current) setOpen(false);
      } else {
        if (urlLama.current && urlLama.current !== pesan.url) buang(urlLama.current);
        urlLama.current = pesan.url;
        setBerkas({ url: pesan.url, filename: pesan.filename });
        setMemuat(false);
        setOpen(true);
      }
    };
    window.addEventListener(EVENT_PANEL_PDF, dengar);
    return () => {
      window.removeEventListener(EVENT_PANEL_PDF, dengar);
      daftarPanelPdf(false);
    };
  }, []);

  const tutup = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setMemuat(false);
      // Kasih waktu animasi tutup sebelum URL dibuang.
      setTimeout(() => {
        if (urlLama.current) buang(urlLama.current);
        urlLama.current = null;
        setBerkas(null);
      }, 400);
    }
  };

  return (
    <Sheet open={open} onOpenChange={tutup}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[min(920px,64vw)]"
      >
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <FileText className="size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-base">{berkas?.filename ?? "Menyiapkan dokumen…"}</SheetTitle>
            <SheetDescription className="sr-only">Pratinjau dokumen</SheetDescription>
          </div>
          {berkas ? (
            <>
              <a
                href={berkas.url}
                download={berkas.filename}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Download className="size-4" /> Unduh
              </a>
              <a
                href={berkas.url}
                target="_blank"
                rel="noreferrer"
                className="hidden h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium hover:bg-slate-50 sm:inline-flex"
              >
                <ExternalLink className="size-4" /> Tab baru
              </a>
            </>
          ) : null}
          <button type="button" onClick={() => tutup(false)} aria-label="Tutup pratinjau" className="inline-flex size-9 items-center justify-center rounded-md hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <div className="relative flex-1 bg-slate-100">
          {memuat || !berkas ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              Menyiapkan dokumen…
            </div>
          ) : isGambar(berkas.url) ? (
            <div className="absolute inset-0 overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={berkas.url} alt={berkas.filename} className="mx-auto h-auto max-w-full rounded-md bg-white shadow-sm" />
            </div>
          ) : bisaIframe ? (
            <iframe key={berkas.url} src={berkas.url} title={berkas.filename} className="absolute inset-0 h-full w-full border-0 bg-white" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <FileText className="size-12 text-primary" />
              <div>
                <p className="font-semibold text-slate-900">Dokumen siap</p>
                <p className="mt-1 text-sm text-muted-foreground">Browser HP belum bisa menampilkan PDF di dalam halaman. Buka atau unduh dokumennya.</p>
              </div>
              <div className="flex w-full max-w-xs flex-col gap-2">
                <a href={berkas.url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground">
                  <ExternalLink className="size-4" /> Buka dokumen
                </a>
                <a href={berkas.url} download={berkas.filename} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border bg-white text-sm font-medium">
                  <Download className="size-4" /> Unduh
                </a>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
