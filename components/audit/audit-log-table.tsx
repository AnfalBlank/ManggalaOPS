"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";

import { TableFilterBar } from "@/components/filters/table-filter-bar";
import { Badge } from "@/components/ui/badge";
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

export function AuditLogTable({ rows }: { rows: AuditRow[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const haystack = `${row.action} ${row.entity ?? ""} ${row.entityId ?? ""} ${row.userName ?? ""} ${row.userEmail ?? ""} ${row.ip ?? ""}`.toLowerCase();
        const matchesQuery = haystack.includes(query.toLowerCase());
        const matchesType = type === "all" || row.action.startsWith(type);
        return matchesQuery && matchesType;
      }),
    [rows, query, type],
  );

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      const prefix = row.action.split(".")[0];
      if (prefix) set.add(prefix);
    });
    return [
      { label: "Semua entity", value: "all" },
      ...Array.from(set).sort().map((item) => ({ label: item, value: item })),
    ];
  }, [rows]);

  return (
    <div className="space-y-4">
      <TableFilterBar
        value={query}
        onChange={setQuery}
        placeholder="Cari user, action, atau IP..."
        typeValue={type}
        onTypeChange={setType}
        typeOptions={typeOptions}
      />

      <div className="w-full overflow-x-auto rounded-2xl border bg-white">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Waktu</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Tidak ada entry yang cocok dengan filter.
                </TableCell>
              </TableRow>
            ) : filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {row.createdAt ? format(new Date(row.createdAt), "dd MMM yyyy HH:mm:ss") : "-"}
                </TableCell>
                <TableCell>
                  {row.userName ? (
                    <div>
                      <div className="text-sm font-medium">{row.userName}</div>
                      <div className="text-xs text-muted-foreground">{row.userEmail ?? "-"}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">— anonymous —</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`${actionStyle(row.action)} border-none font-mono text-xs`}>{row.action}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {row.entity ? (
                    <span>
                      {row.entity}
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

      <p className="text-xs text-muted-foreground">
        Total {filtered.length} dari {rows.length} entry yang ditampilkan. Audit log menyimpan 500 entry terbaru.
      </p>
    </div>
  );
}
