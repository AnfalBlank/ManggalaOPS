import { NextRequest, NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api-helpers";
import { getCurrentRole } from "@/lib/auth";
import { getNotificationsForRole, markAllNotificationsRead } from "@/lib/notifications";

export async function GET() {
  try {
    const role = await getCurrentRole();
    if (!role) return NextResponse.json({ error: "Belum login" }, { status: 401 });
    const data = await getNotificationsForRole(role);
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Gagal ngambil notifikasi");
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = await getCurrentRole();
    if (!role) return NextResponse.json({ error: "Belum login" }, { status: 401 });
    const body = await request.json();

    if (body.action === "mark-all-read") {
      await markAllNotificationsRead(role);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Aksi gak dikenal" }, { status: 400 });
  } catch (error) {
    return toErrorResponse(error, "Gagal ubah notifikasi");
  }
}
