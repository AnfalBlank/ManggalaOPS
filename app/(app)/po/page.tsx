import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

import { PageWrapper } from "@/components/layout/page-wrapper";
import { CatatPoDialog } from "@/components/po/po-dialogs";
import { DeretTahap, LabelPosisi } from "@/components/po/tahap";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/state";
import { getQuotations } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientPoList } from "@/lib/po";

const tgl = (iso: string | null) => (iso ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "-");

export default async function DaftarPo({ searchParams }: { searchParams: Promise<{ lihat?: string }> }) {
  try {
    const { lihat } = await searchParams;
    const semua = lihat === "semua";
    const [list, quotations] = await Promise.all([getClientPoList(), getQuotations()]);
    const sudahPo = new Set(list.map((p) => p.quotationId));
    const bisaDicatat = quotations
      .filter((q) => !sudahPo.has(q.id) && q.status !== "Rejected")
      .map((q) => ({ id: q.id, code: q.code, clientName: q.clientName, subject: q.subject, total: q.total ?? 0, status: q.status }));
    const tampil = semua ? list : list.filter((p) => !p.selesai);
    const jumlahJalan = list.filter((p) => !p.selesai).length;

    return (
      <PageWrapper>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">PO klien</h1>
            <p className="text-muted-foreground mt-1">PO atau kontrak dari klien, dan sampai mana tiap PO udah jalan.</p>
          </div>
          <CatatPoDialog penawaran={bisaDicatat} />
        </div>

        <div className="flex gap-2 text-sm">
          <Link href="/po" className={`rounded-full border px-3 py-1.5 font-medium ${!semua ? "bg-primary text-primary-foreground border-primary" : "bg-white"}`}>
            Belum selesai ({jumlahJalan})
          </Link>
          <Link href="/po?lihat=semua" className={`rounded-full border px-3 py-1.5 font-medium ${semua ? "bg-primary text-primary-foreground border-primary" : "bg-white"}`}>
            Semua ({list.length})
          </Link>
        </div>

        {tampil.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {list.length === 0 ? "Belum ada PO klien. Klik \"Catat PO klien\" begitu klien ngirim PO atau kontrak." : "Semua PO udah selesai."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {tampil.map((p) => (
              <Link key={p.id} href={`/po/${p.id}`} className="block">
                <Card className="transition hover:shadow-md">
                  <CardContent className="p-4 grid gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{p.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          PO {p.poNumber} · {tgl(p.poDate)} · dari {p.quotationCode}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold whitespace-nowrap">{formatCurrency(p.value)}</p>
                        <div className="mt-1">
                          <LabelPosisi posisi={p.posisi} selesai={p.selesai} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <DeretTahap tahap={p.tahap} ringkas />
                      <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                        {p.fileUrl ? <FileText className="size-4" aria-label="Ada file PO" /> : null}
                        <ChevronRight className="size-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat PO" description={error instanceof Error ? error.message : "Terjadi error."} />
      </PageWrapper>
    );
  }
}
