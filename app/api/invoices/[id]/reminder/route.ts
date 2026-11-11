import { NextRequest, NextResponse } from "next/server";

import { ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { getClientIp } from "@/lib/rate-limit";
import { cariNomor } from "@/lib/nomor-dokumen";

/**
 * Track that a WhatsApp reminder was opened by the user. The browser opens
 * the wa.me link directly, so this endpoint is informational — used to keep
 * an audit trail and surface in-app notifications for finance.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireRole(["admin", "finance", "sales"]);
    const { id } = await params;
    const invoiceId = ensurePositiveInt(id, "invoice id");

    const body = await req.json().catch(() => ({}));
    const tone = trimString(body.tone, 100) || "friendly";
    const channel = trimString(body.channel, 50) || "whatsapp";

    await audit({
      userId: user.id,
      action: "invoice.reminder.sent",
      entity: "invoice",
      entityId: invoiceId,
      payload: { tone, channel },
      ip: getClientIp(req),
    });

    await createNotification({
      title: `Pengingat ${channel === "whatsapp" ? "WhatsApp" : channel} terkirim`,
      message: `${user.name} ngirim pengingat ke klien untuk tagihan ${await cariNomor("INV", invoiceId)}.`,
      type: "info",
      targetRole: "finance",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to log reminder");
  }
}
