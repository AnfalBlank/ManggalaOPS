import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { ensure, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, validatePasswordStrength } from "@/lib/session-auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? "",
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  try {
    const body = await request.json();
    const name = trimString(body.name ?? user.name, 200);
    const email = trimString(body.email ?? user.email, 200).toLowerCase();
    ensure(name.length > 0, "Nama wajib diisi");
    ensure(email.length > 0, "Email wajib diisi");

    const updateData: { name: string; email: string; avatarUrl: string | null; passwordHash?: string } = {
      name,
      email,
      avatarUrl: trimString(body.avatarUrl ?? user.avatarUrl ?? "", 500) || null,
    };

    if (body.password) {
      validatePasswordStrength(String(body.password));
      updateData.passwordHash = await bcrypt.hash(String(body.password), 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, user.id));
    await audit({ userId: user.id, action: "profile.update", entity: "user", entityId: user.id });
    const updated = await db.query.users.findFirst({ where: eq(users.id, user.id) });

    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    return toErrorResponse(error, "Gagal nyimpen profil");
  }
}
