import { desc, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import type { AppRole } from "@/lib/auth";

export async function createNotification(input: { title: string; message?: string; type?: string; targetRole?: AppRole | null }) {
  await db.insert(notifications).values({
    title: input.title,
    message: input.message ?? null,
    type: input.type ?? "info",
    targetRole: input.targetRole ?? null,
    isRead: false,
    createdAt: new Date(),
  });
}

export async function getNotificationsForRole(role: AppRole) {
  return db.select().from(notifications).where(or(eq(notifications.targetRole, role), isNull(notifications.targetRole))).orderBy(desc(notifications.id)).limit(20);
}

export async function markAllNotificationsRead(role: AppRole) {
  const rows = await getNotificationsForRole(role);
  const ids = rows.filter((row) => !row.isRead).map((row) => row.id);
  for (const id of ids) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }
}
