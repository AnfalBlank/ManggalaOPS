import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session-auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const updateData: { name?: string; email?: string; avatarUrl?: string | null; passwordHash?: string } = {
      name: String(body.name ?? user.name).trim(),
      email: String(body.email ?? user.email).trim(),
      avatarUrl: String(body.avatarUrl ?? user.avatarUrl ?? "").trim() || null,
    };

    if (body.password) {
      updateData.passwordHash = await bcrypt.hash(String(body.password), 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, user.id));
    const updated = await db.query.users.findFirst({ where: eq(users.id, user.id) });

    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update profile" }, { status: 500 });
  }
}
