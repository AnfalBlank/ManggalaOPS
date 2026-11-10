import { NextResponse } from "next/server";

import { getCurrentRole, roleLabels, type AppRole } from "@/lib/auth";

const roles = Object.keys(roleLabels) as AppRole[];

export async function GET() {
  const role = await getCurrentRole();
  return NextResponse.json({ role, roles });
}

export async function POST() {
  return NextResponse.json({ error: "Ganti jabatan dimatiin" }, { status: 403 });
}
