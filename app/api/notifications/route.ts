import { NextRequest, NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api-helpers";
import { getCurrentRole } from "@/lib/auth";
import { getNotificationsForRole, markAllNotificationsRead } from "@/lib/notifications";

export async function GET() {
  try {
    const role = await getCurrentRole();
    if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = await getNotificationsForRole(role);
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch notifications");
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = await getCurrentRole();
    if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();

    if (body.action === "mark-all-read") {
      await markAllNotificationsRead(role);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return toErrorResponse(error, "Failed to update notifications");
  }
}
