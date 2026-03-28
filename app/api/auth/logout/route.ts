import { NextResponse } from "next/server";

import { logoutSession } from "@/lib/session-auth";

export async function POST() {
  await logoutSession();
  return NextResponse.json({ ok: true });
}
