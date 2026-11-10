"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Pagination, paginate } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AuditRow = {
  id: number;
  action: string;
  entity: string | null;
  entityId: string | null;
  payload: string | null;
  ip: string | null;
  createdAt: string | null;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
};

const actionStyles: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-800",
  update: "bg-amber-100 text-amber-800",
  delete: "bg-rose-100 text-rose-800",
  login: "bg-blue-100 text-blue-800",
  logout: "bg-slate-200 text-slate-700",
};

function actionStyle(action: string) {
  if (action.includes("delete")) return actionStyles.delete;
  if (action.includes("create")) return actionStyles.create;
  if (action.includes("update")) return actionStyles.update;
  if (action.startsWith("login")) return actionStyles.login;
  if (action.startsWith("logout")) return actionStyles.logout;
  return "bg-slate-100 text-slate-700";
}

const NAMA_DATA: Record<string, string> = {
  user: "Pengguna", quotation: "Penawaran", invoice: "Tagihan", client: "Klien", delivery_order: "Surat jalan",
  upload: "File", payment: "Pembayaran", expense: "Pengeluaran", lead: "Calon klien", settings: "Setelan",
  client_po: "PO klien", supplier_po: "PO supplier", project: "Proyek", login: "Login", logout: "Keluar",
};
const NAMA_AKSI: Record<string, string> = {
  create: "dibuat", update: "diubah", delete: "dihapus", accept: "diterima", success: "berhasil", failed: "gagal",
  from_invoice: "dibuat dari tagihan", create_from_po: "dibuat dari PO", "reminder.sent": "pengingat dikirim",
};
function labelAksi(action: string) {
  if (action === "logout") return "Keluar";
  const [depan, ...sisa] = action.split(".");
  const belakang = sisa.join(".");
  if (depan === "login") return belakang === "failed" ? "Login gagal" : "Login";
  const nama = NAMA_DATA[depan] ?? depan;
  return belakang ? `${nama} ${NAMA_AKSI[belakang] ?? belakang}` : nama;
}

export function AuditLogTable({ rows }: { rows: AuditRow[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const haystack = `${row.action} ${labelAksi(row.action)} ${row.entity ?? ""} ${row.entityId ?? ""} ${row.userName ?? ""} ${row.userEmail ?? ""} ${row.ip ?? ""}`.toLowerCase();
        const matchesQuery = haystack.includes(query.toLowerCase());
        const matchesType = type === "all" || row.action.startsWith(type);
        return matchesQuery && matchesType;
      }),
    [rows, query, type],
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => { setPage(1); }, [query, type, pageSize]);
  const paged = paginate(filtered, page, pageSize);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      const prefix = row.action.split(".")[0];
      if (prefix) set.add(prefix);
    });
    return [
      { label: "Semua jenis data", value: "all" },
      ...Array.from(set).sort().map((item) => ({ label: NAMA_DATA[item] ?? item, value: item })),
    ];
  }, [rows]);

  return (
    <div className="space-y-4">
      <TableFilterBar
        value={query}
        onChange={setQuery}
        placeholder="Cari nama, aksi, atau IP..."
        typeValue={type}
        onTypeChange={setType}
        typeOptions={typeOptions}
      />

      <div className="w-full overflow-x-auto md:rounded-2xl md:border md:bg-white">
        <Table className="min-w-[900px] xl:min-w-0">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Waktu</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Gak ada catatan yang cocok.
                </TableCell>
              </TableRow>
            ) : paged.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {row.createdAt ? format(new Date(row.createdAt), "dd MMM yyyy HH:mm:ss", { locale: localeId }) : "-"}
                </TableCell>
                <TableCell>
                  {row.userName ? (
                    <div>
                      <div className="text-sm font-medium">{row.userName}</div>
                      <div className="text-xs text-muted-foreground">{row.userEmail ?? "-"}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">— tanpa nama —</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`${actionStyle(row.action)} border-none text-xs`} title={row.action}>{labelAksi(row.action)}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {row.entity ? (
                    <span>
                      {NAMA_DATA[row.entity] ?? row.entity}
                      {row.entityId ? <span className="text-muted-foreground"> #{row.entityId}</span> : null}
                    </span>
                  ) : "-"}
                </TableCell>
                <TableCell className="max-w-[280px]">
                  <code className="text-[11px] text-muted-foreground line-clamp-2 break-all" title={row.payload ?? "-"}>
                    {row.payload ?? "-"}
                  </code>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{row.ip ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />

      <p className="text-xs text-muted-foreground">
        Tampil {filtered.length} dari {rows.length} catatan (500 catatan terbaru).
      </p>
    </div>
  );
}
