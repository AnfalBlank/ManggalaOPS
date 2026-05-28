import { desc, eq, isNull, or } from "drizzle-orm";

import { PageWrapper } from "@/components/layout/page-wrapper";
import { NotificationsHistory } from "@/components/notifications/notifications-history";
import { ErrorState } from "@/components/ui/state";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentRole } from "@/lib/auth";

export default async function NotificationsPage() {
  try {
    const role = await getCurrentRole();
    if (!role) {
      return (
        <PageWrapper>
          <ErrorState title="Unauthorized" description="Silakan login terlebih dahulu." />
        </PageWrapper>
      );
    }

    const items = await db
      .select()
      .from(notifications)
      .where(or(eq(notifications.targetRole, role), isNull(notifications.targetRole)))
      .orderBy(desc(notifications.id))
      .limit(200);

    return (
      <PageWrapper>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Notifications</h1>
          <p className="text-muted-foreground mt-1">Riwayat notifikasi sistem (200 terbaru).</p>
        </div>
        <NotificationsHistory items={items.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          type: item.type,
          isRead: !!item.isRead,
          createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
        }))} />
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat notifications" description={error instanceof Error ? error.message : "Terjadi error."} />
      </PageWrapper>
    );
  }
}
