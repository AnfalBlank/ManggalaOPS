import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { ensure, ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { allRoles, requireRole, type AppRole } from "@/lib/auth";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { validatePasswordStrength } from "@/lib/session-auth";

const userSelect = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  avatarUrl: users.avatarUrl,
  createdAt: users.createdAt,
};

function ensureValidRole(role: string): AppRole {
  if (!allRoles.includes(role as AppRole)) {
    throw new Error(`Role tidak valid. Pilih salah satu: ${allRoles.join(", ")}`);
  }
  return role as AppRole;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user: actor } = await requireRole(["admin"]);
    const { id } = await params;
    const userId = ensurePositiveInt(id, "user id");
    const body = await request.json();
    const name = trimString(body.name, 200);
    const email = trimString(body.email, 200).toLowerCase();
    ensure(name.length > 0, "Nama wajib diisi");
    ensure(email.length > 0, "Email wajib diisi");
    const role = ensureValidRole(trimString(body.role, 50) || "sales");

    const updateData: { name: string; email: string; role: string; avatarUrl: string | null; passwordHash?: string } = {
      name,
      email,
      role,
      avatarUrl: trimString(body.avatarUrl, 500) || null,
    };

    if (body.password) {
      validatePasswordStrength(String(body.password));
      updateData.passwordHash = await bcrypt.hash(String(body.password), 10);
      // Force-logout on password change.
      await db.delete(sessions).where(eq(sessions.userId, userId));
    }

    if (userId === actor.id && actor.role === "admin" && role !== "admin") {
      throw new Error("Admin tidak boleh menurunkan role akun sendiri");
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));
    await audit({ userId: actor.id, action: "user.update", entity: "user", entityId: userId, payload: { email, role } });
    const data = await db.select(userSelect).from(users).orderBy(desc(users.id));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return toErrorResponse(error, "Gagal nyimpen pengguna");
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user: actor } = await requireRole(["admin"]);
    const { id } = await params;
    const userId = ensurePositiveInt(id, "user id");
    if (userId === actor.id) {
      throw new Error("Tidak boleh menghapus akun sendiri");
    }
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    await audit({ userId: actor.id, action: "user.delete", entity: "user", entityId: userId });
    const data = await db.select(userSelect).from(users).orderBy(desc(users.id));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return toErrorResponse(error, "Gagal hapus pengguna");
  }
}
