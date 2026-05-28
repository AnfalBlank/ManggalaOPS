import { desc, eq } from "drizzle-orm";

import { RoleGuard } from "@/components/auth/guard";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ErrorState } from "@/components/ui/state";
import { db } from "@/db";
import { auditLog, users } from "@/db/schema";

export default async function AuditLogPage() {
  try {
    const rows = await db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        entity: auditLog.entity,
        entityId: auditLog.entityId,
        payload: auditLog.payload,
        ip: auditLog.ip,
        createdAt: auditLog.createdAt,
        userId: auditLog.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .orderBy(desc(auditLog.id))
      .limit(500);

    return (
      <PageWrapper>
        <RoleGuard allow={["admin"]}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Audit Log</h1>
            <p className="text-muted-foreground mt-1">
              Riwayat aktivitas sensitif: pembuatan, perubahan, dan penghapusan data oleh user (500 entry terbaru).
            </p>
          </div>
          <AuditLogTable
            rows={rows.map((row) => ({
              id: row.id,
              action: row.action,
              entity: row.entity,
              entityId: row.entityId,
              payload: row.payload,
              ip: row.ip,
              createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
              userId: row.userId,
              userName: row.userName,
              userEmail: row.userEmail,
            }))}
          />
        </RoleGuard>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState
          title="Gagal memuat audit log"
          description={error instanceof Error ? error.message : "Terjadi error saat memuat audit log."}
        />
      </PageWrapper>
    );
  }
}
