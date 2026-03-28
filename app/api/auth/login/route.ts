import { NextRequest, NextResponse } from "next/server";

import { loginWithPassword } from "@/lib/session-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    const user = await loginWithPassword(email, password);
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login gagal" },
      { status: 401 },
    );
  }
}
