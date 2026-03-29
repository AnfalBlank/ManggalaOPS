import { NextRequest, NextResponse } from "next/server";

import { getCurrentRole } from "@/lib/auth";
import { getNotificationsForRole, markAllNotificationsRead } from "@/lib/notifications";

export async function GET() {
  try {
    const role = await getCurrentRole();
    const data = await getNotificationsForRole(role);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = await getCurrentRole();

    if (body.action === "mark-all-read") {
      await markAllNotificationsRead(role);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update notifications" }, { status: 500 });
  }
}
