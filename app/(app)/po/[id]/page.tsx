import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { PageWrapper } from "@/components/layout/page-wrapper";
import { DownloadDeliveryOrderButton } from "@/components/pdf/download-delivery-order-button";
import { AksiPo, LihatPoSupplier } from "@/components/po/po-aksi";
import { PoSupplierDialog, SuratJalanDialog, TagihanDariPoDialog } from "@/components/po/po-dialogs";
import { DeretTahap, LabelPosisi } from "@/components/po/tahap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineStatusSelect } from "@/components/ui/inline-status-select";
import { getInvoices } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getClientPoDetail } from "@/lib/po";
import { getCurrentUser } from "@/lib/session-auth";
import { getAppSettings } from "@/lib/settings";

const tgl = (iso: string | null) => (iso ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "-");
const baris1 = (t: string) => t.split("\n")[0];

function Bagian({ judul, keterangan, aksi, children }: { judul: string; keterangan?: string; aksi?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col gap-3 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">{judul}</CardTitle>
          {keterangan ? <p className="mt-0.5 text-sm text-muted-foreground">{keterangan}</p> : null}
        </div>
        {aksi}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function Kosong({ teks }: { teks: string }) {
  return <p className="p-4 text-sm text-muted-foreground">{teks}</p>;
}

export default async function DetailPo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poId = Number(id);
  if (!Number.isInteger(poId) || poId <= 0) notFound();
  const [detail, settings, semuaTagihan, user] = await Promise.all([getClientPoDetail(poId), getAppSettings(), getInvoices(), getCurrentUser()]);
  if (!detail) notFound();
  const { po, items, suratJalan, poSupplier, penerima, tagihanDefault } = detail;
  const tagihan = semuaTagihan.filter((t) => t.clientPoId === poId);
  const role = user?.role ?? "";
  const bisaUang = ["admin", "finance", "sales"].includes(role);
  const bisaKirim = ["admin", "sales", "project_manager"].includes(role);
  const lihatTagihan = ["admin", "finance"].includes(role);
  const kop = {
    companyName: settings.companyName,
    companyEmail: settings.companyEmail,
    companyPhone: settings.companyPhone,
    companyAddress: settings.companyAddress,
    defaultSignatoryName: settings.defaultSignatoryName,
    defaultSignatoryTitle: settings.defaultSignatoryTitle,
  };
  const sisaTagih = Math.max((po.value || 0) - po.ditagih, 0);
  const terbuka = !po.closedAt;

  return (
    <PageWrapper>
      <Link href="/po" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
        <ArrowLeft className="size-4" /> Semua PO
      </Link>

      <Card className="border-border/60">
        <CardContent className="grid gap-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{po.clientName}</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary break-words">PO {po.poNumber}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tanggal PO {tgl(po.poDate)} · dari{" "}
                <Link href="/quotations" className="font-medium text-primary underline">
                  {po.quotationCode}
                </Link>
                {po.quotationSubject ? ` · ${po.quotationSubject}` : ""}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(po.value)}</p>
              <div className="mt-1">
                <LabelPosisi posisi={po.posisi} selesai={po.selesai} />
              </div>
            </div>
          </div>
          <DeretTahap tahap={po.tahap} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {po.fileUrl ? (
              <a href={po.fileUrl.replace(/^\/uploads\//, "/api/uploads/")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary underline">
                <FileText className="size-4" /> Lihat file PO dari klien
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">File PO dari klien belum diupload.</span>
            )}
            {bisaUang ? <AksiPo id={po.id} ditutup={!terbuka} bisaDihapus={role === "admin" && suratJalan.length === 0 && tagihan.length === 0 && poSupplier.length === 0} /> : null}
          </div>
          {po.notes ? <p className="rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-line">{po.notes}</p> : null}
        </CardContent>
      </Card>

      <Bagian judul="Barang di PO" keterangan={`${po.qtyDikirim} dari ${po.qtyTotal} terkirim`}>
        {items.length === 0 ? (
          <Kosong teks="Penawaran ini gak punya daftar barang." />
        ) : (
          <ul className="divide-y divide-border/50">
            {items.map((i) => {
              const sisa = Math.max(i.qty - i.dikirim, 0);
              return (
                <li key={i.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 line-clamp-2 whitespace-pre-line">{i.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {i.qty} {i.unit} × {formatCurrency(i.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 text-sm">
                    <p className={sisa === 0 ? "font-medium text-emerald-700" : "font-medium text-slate-900"}>{sisa === 0 ? "Terkirim semua" : `Sisa ${sisa}`}</p>
                    <p className="text-xs text-muted-foreground">dikirim {i.dikirim}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Bagian>

      <Bagian
        judul="PO ke supplier"
        keterangan="Pembelian barang ke supplier buat PO ini."
        aksi={bisaUang && terbuka && items.length > 0 ? <PoSupplierDialog poId={po.id} items={items} /> : null}
      >
        {poSupplier.length === 0 ? (
          <Kosong teks="Belum ada PO ke supplier. Kalau barangnya gak dibeli ke supplier (jasa / stok sendiri), lewati aja." />
        ) : (
          <ul className="divide-y divide-border/50">
            {poSupplier.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{s.supplierName}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.code} · {tgl(s.date)} · {s.items.length} barang · {formatCurrency(s.total)}
                    {s.expectedDate ? ` · paling lambat ${tgl(s.expectedDate)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <InlineStatusSelect currentStatus={s.status} options={["Draft", "Dikirim ke supplier", "Barang diterima", "Batal"]} endpoint={`/api/po-supplier/${s.id}`} disabled={!bisaUang} />
                  <LihatPoSupplier sup={s} kop={kop} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Bagian>

      <Bagian
        judul="Surat jalan"
        keterangan="Tiap pengiriman barang buat PO ini. Kirim sebagian boleh."
        aksi={bisaKirim && terbuka && items.length > 0 ? <SuratJalanDialog poId={po.id} items={items} penerima={penerima} /> : null}
      >
        {suratJalan.length === 0 ? (
          <Kosong teks="Belum ada surat jalan." />
        ) : (
          <ul className="divide-y divide-border/50">
            {suratJalan.map((d) => (
              <li key={d.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {d.code} · {tgl(d.date)}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {d.items.map((i) => `${i.qty} ${i.unit ?? ""} ${baris1(i.description)}`).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <InlineStatusSelect currentStatus={d.status} options={["Draft", "In Transit", "Delivered", "Cancelled"]} endpoint={`/api/delivery-orders/${d.id}/status`} disabled={!bisaKirim} />
                  <DownloadDeliveryOrderButton
                    payload={{
                      id: d.code,
                      client: d.clientName,
                      project: d.projectName,
                      date: d.date ? new Date(d.date) : new Date(),
                      invoiceCode: d.invoiceCode,
                      poNumber: po.poNumber,
                      vehicleNumber: d.vehicleNumber,
                      driverName: d.driverName,
                      shippingMethod: d.shippingMethod,
                      recipientName: d.recipientName,
                      recipientCompany: d.recipientCompany,
                      recipientAddress: d.recipientAddress,
                      recipientPhone: d.recipientPhone,
                      subject: d.subject,
                      introduction: d.introduction,
                      notes: d.notes,
                      closingNote: d.closingNote,
                      signatoryName: d.signatoryName ?? settings.defaultSignatoryName ?? null,
                      signatoryTitle: d.signatoryTitle ?? settings.defaultSignatoryTitle ?? null,
                      companyName: settings.companyName,
                      companyEmail: settings.companyEmail,
                      companyPhone: settings.companyPhone,
                      companyAddress: settings.companyAddress,
                      items: d.items.map((i) => ({ description: i.description, qty: i.qty, unit: i.unit, serialNumber: i.serialNumber, notes: i.notes })),
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Bagian>

      {lihatTagihan ? (
      <Bagian
        judul="Tagihan"
        keterangan={`Ditagih ${formatCurrency(po.ditagih)} dari ${formatCurrency(po.value)} · dibayar ${formatCurrency(po.dibayar)}`}
        aksi={
          terbuka && items.length > 0 ? (
            <TagihanDariPoDialog
              po={{ id: po.id, clientId: po.clientId, projectId: po.projectId, quotationId: po.quotationId, poNumber: po.poNumber }}
              items={items}
              penerima={penerima}
              sisaTagih={sisaTagih}
              bawaan={{
                subject: tagihanDefault.subject,
                paymentMethod: tagihanDefault.paymentMethod,
                taxPercent: tagihanDefault.taxPercent,
                dueDays: settings.invoiceDueDays ?? 14,
                signatoryName: settings.defaultSignatoryName,
                signatoryTitle: settings.defaultSignatoryTitle,
              }}
            />
          ) : null
        }
      >
        {tagihan.length === 0 ? (
          <Kosong teks="Belum ada tagihan buat PO ini." />
        ) : (
          <ul className="divide-y divide-border/50">
            {tagihan.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {t.code} · {tgl(t.date)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Jatuh tempo {tgl(t.dueDate)} · dibayar {formatCurrency(t.amountPaid)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold whitespace-nowrap">{formatCurrency(t.total)}</p>
                  <p className="text-xs text-muted-foreground">{t.status}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-border/50 p-4">
          <Link href="/invoices" className="text-sm font-medium text-primary underline">
            Lihat PDF tagihan & catat pembayaran di menu Tagihan
          </Link>
        </div>
      </Bagian>
      ) : null}
    </PageWrapper>
  );
}
