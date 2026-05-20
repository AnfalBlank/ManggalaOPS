import { NextResponse } from "next/server";

import { audit } from "@/lib/audit";
import { getCurrentUser, logoutSession } from "@/lib/session-auth";

export async function POST() {
  const user = await getCurrentUser();
  await logoutSession();
  if (user) {
    await audit({ userId: user.id, action: "logout", entity: "user", entityId: user.id });
  }
  return NextResponse.json({ ok: true });
}
