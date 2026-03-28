import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    const userId = Number(id);
    const body = await request.json();

    const updateData: { name?: string; email?: string; role?: string; passwordHash?: string } = {
      name: String(body.name ?? "").trim(),
      email: String(body.email ?? "").trim(),
      role: String(body.role ?? "sales").trim(),
    };

    if (body.password) {
      updateData.passwordHash = await bcrypt.hash(String(body.password), 10);
      await db.delete(sessions).where(eq(sessions.userId, userId));
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));
    const data = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).orderBy(desc(users.id));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    const userId = Number(id);
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    const data = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).orderBy(desc(users.id));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete user" }, { status: 500 });
  }
}
