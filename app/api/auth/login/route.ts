import { NextRequest, NextResponse } from "next/server";

import { audit } from "@/lib/audit";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { loginWithPassword } from "@/lib/session-auth";

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipResult = rateLimit(`login:ip:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!ipResult.allowed) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan login. Coba lagi dalam ${ipResult.resetInSeconds} detik.` },
      { status: 429, headers: { "Retry-After": String(ipResult.resetInSeconds) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body request tidak valid" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
  }

  const emailResult = rateLimit(`login:email:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!emailResult.allowed) {
    return NextResponse.json(
      { error: "Akun ini sementara terkunci karena terlalu banyak percobaan gagal. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(emailResult.resetInSeconds) } },
    );
  }

  try {
    const user = await loginWithPassword(email, password);
    await audit({ userId: user.id, action: "login.success", entity: "user", entityId: user.id, ip });
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    await audit({ action: "login.failed", entity: "user", payload: { email }, ip });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login gagal" },
      { status: 401 },
    );
  }
}
