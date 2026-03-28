import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentRole, roleLabels, type AppRole } from "@/lib/auth";

const roles = Object.keys(roleLabels) as AppRole[];

export async function GET() {
  const role = await getCurrentRole();
  return NextResponse.json({ role, roles });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const role = body.role as AppRole;

  if (!roles.includes(role)) {
    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set("manggala_role", role, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ ok: true, role });
}
