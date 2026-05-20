import bcrypt from "bcryptjs";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { ensure, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { allRoles, requireRole, type AppRole } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { PASSWORD_MIN_LENGTH, validatePasswordStrength } from "@/lib/session-auth";

const userSelect = { id: users.id, name: users.name, email: users.email, role: users.role, avatarUrl: users.avatarUrl, createdAt: users.createdAt };

function ensureValidRole(role: string): AppRole {
  if (!allRoles.includes(role as AppRole)) {
    throw new Error(`Role tidak valid. Pilih salah satu: ${allRoles.join(", ")}`);
  }
  return role as AppRole;
}

export async function GET() {
  try {
    await requireRole(["admin"]);
    const data = await db.select(userSelect).from(users).orderBy(desc(users.id));
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch users");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user: actor } = await requireRole(["admin"]);
    const body = await request.json();
    const password = String(body.password ?? "");
    validatePasswordStrength(password);
    const name = trimString(body.name, 200);
    const email = trimString(body.email, 200).toLowerCase();
    ensure(name.length > 0, "Nama wajib diisi");
    ensure(email.length > 0, "Email wajib diisi");
    const role = ensureValidRole(trimString(body.role, 50) || "sales");
    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name,
      email,
      passwordHash,
      role,
      avatarUrl: trimString(body.avatarUrl, 500) || null,
      createdAt: new Date(),
    });

    await audit({ userId: actor.id, action: "user.create", entity: "user", payload: { email, role } });
    const data = await db.select(userSelect).from(users).orderBy(desc(users.id));
    return NextResponse.json({ ok: true, data, passwordPolicy: { minLength: PASSWORD_MIN_LENGTH } });
  } catch (error) {
    return toErrorResponse(error, "Failed to create user");
  }
}
