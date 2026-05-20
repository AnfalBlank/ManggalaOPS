import { db } from "@/db";
import { auditLog } from "@/db/schema";

export type AuditEntry = {
  userId?: number | null;
  action: string;
  entity?: string | null;
  entityId?: string | number | null;
  payload?: Record<string, unknown> | null;
  ip?: string | null;
};

/**
 * Persist an audit log row. Failures are swallowed to avoid breaking the
 * primary action (delete invoice still succeeds even if audit write fails).
 */
export async function audit(entry: AuditEntry) {
  try {
    await db.insert(auditLog).values({
      userId: entry.userId ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entityId: entry.entityId == null ? null : String(entry.entityId),
      payload: entry.payload ? JSON.stringify(entry.payload).slice(0, 4000) : null,
      ip: entry.ip ?? null,
      createdAt: new Date(),
    });
  } catch {
    // do not throw
  }
}
