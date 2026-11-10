"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Eye, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { labelKategori } from "@/lib/expense-categories";
import { formatCurrency } from "@/lib/format";
import { labelStatus } from "@/lib/label-status";

type Summary = {
  lihatUang?: boolean;
  project: { id: number; code: string; name: string; value: number; status: string; progress: number };
  quotations: Array<{ id: number; code: string; status: string; total: number; date?: string | Date | null }>;
  invoices: Array<{ id: number; code: string; date?: string | Date | null; status: string; total: number; amountPaid: number; outstanding: number }>;
  expenses: Array<{ id: number; code: string; date?: string | Date | null; category: string; description: string; amount: number; status: string | null }>;
  summary: {
    totalQuotationValue: number;
    totalInvoiceValue: number;
    totalCollected: number;
    totalOutstanding: number;
    totalExpense: number;
    netProjectMargin: number;
  };
};

const fmtDate = (d?: string | Date | null) => {
  if (!d) return "-";
  try {
    return format(new Date(d), "dd MMM yyyy", { locale: localeId });
  } catch {
    return "-";
  }
};

export function ProjectDetailDialog({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  useEffect(() => {
    if (!open || data) return;
    setLoading(true);
    setGagal(null);
    fetch(`/api/projects/${projectId}/summary`)
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.project) setData(payload);
        else setGagal(payload?.error ?? "Ringkasan proyek gagal dimuat.");
      })
      .catch(() => setGagal("Ringkasan proyek gagal dimuat. Cek koneksi lalu coba lagi."))
      .finally(() => setLoading(false));
  }, [open, data, projectId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm"><Eye className="size-4" /> Detail</Button>} />
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Detail proyek {data?.project?.code ?? `#${projectId}`}</DialogTitle>
          <DialogDescription>{data && data.lihatUang === false ? "Penawaran yang terhubung ke proyek ini." : "Ringkasan uang proyek: penawaran, tagihan, pembayaran, dan pengeluaran."}</DialogDescription>
        </DialogHeader>

        {loading && !data ? (
          <div className="py-12 flex justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : gagal && !data ? (
          <p className="py-8 text-center text-sm text-destructive">{gagal}</p>
        ) : data ? (
          <div className="space-y-5">
            {/* Summary stat cards */}
            {data.lihatUang !== false ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground uppercase">Nilai kontrak</div>
                <div className="font-semibold">{formatCurrency(data.project.value)}</div>
              </div>
              <div className="rounded-lg border p-3 bg-emerald-50/50">
                <div className="text-xs text-emerald-700 uppercase">Uang masuk</div>
                <div className="font-semibold text-emerald-700">{formatCurrency(data.summary.totalCollected)}</div>
              </div>
              <div className="rounded-lg border p-3 bg-amber-50/50">
                <div className="text-xs text-amber-700 uppercase">Belum dibayar</div>
                <div className="font-semibold text-amber-700">{formatCurrency(data.summary.totalOutstanding)}</div>
              </div>
              <div className="rounded-lg border p-3 bg-rose-50/50">
                <div className="text-xs text-rose-700 uppercase">Pengeluaran</div>
                <div className="font-semibold text-rose-700">{formatCurrency(data.summary.totalExpense)}</div>
              </div>
              <div className={`rounded-lg border p-3 col-span-2 md:col-span-1 ${data.summary.netProjectMargin >= 0 ? "bg-blue-50/50" : "bg-rose-100"}`}>
                <div className="text-xs uppercase text-blue-700">Untung bersih (masuk − keluar)</div>
                <div className={`font-bold text-lg ${data.summary.netProjectMargin >= 0 ? "text-blue-700" : "text-rose-700"}`}>
                  {formatCurrency(data.summary.netProjectMargin)}
                </div>
              </div>
            </div>
            ) : (
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground uppercase">Nilai kontrak</div>
                <div className="font-semibold">{formatCurrency(data.project.value)}</div>
              </div>
            )}

            {/* Quotations */}
            <section>
              <h3 className="font-semibold mb-2">Penawaran ({data.quotations.length})</h3>
              {data.quotations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada penawaran untuk proyek ini.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.quotations.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell>{q.code}</TableCell>
                        <TableCell>{fmtDate(q.date)}</TableCell>
                        <TableCell>{labelStatus(q.status)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(q.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>

            {data.lihatUang !== false ? (
            <>
            {/* Invoices */}
            <section>
              <h3 className="font-semibold mb-2">Tagihan ({data.invoices.length})</h3>
              {data.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada tagihan untuk proyek ini.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Dibayar</TableHead>
                      <TableHead className="text-right">Sisa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.code}</TableCell>
                        <TableCell>{fmtDate(inv.date)}</TableCell>
                        <TableCell>{labelStatus(inv.status)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(inv.total)}</TableCell>
                        <TableCell className="text-right text-emerald-600">{formatCurrency(inv.amountPaid)}</TableCell>
                        <TableCell className="text-right text-amber-600">{formatCurrency(inv.outstanding)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>

            {/* Expenses */}
            <section>
              <h3 className="font-semibold mb-2">Pengeluaran ({data.expenses.length})</h3>
              {data.expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada pengeluaran yang dicatat untuk proyek ini.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>{exp.code}</TableCell>
                        <TableCell>{fmtDate(exp.date)}</TableCell>
                        <TableCell>{labelKategori(exp.category)}</TableCell>
                        <TableCell className="max-w-[300px] truncate max-md:max-w-none" title={exp.description}>{exp.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(exp.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
            </>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
