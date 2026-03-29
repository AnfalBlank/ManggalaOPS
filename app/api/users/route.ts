import bcrypt from "bcryptjs";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  try {
    await requireRole(["admin"]);
    const data = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, avatarUrl: users.avatarUrl, createdAt: users.createdAt }).from(users).orderBy(desc(users.id));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch users" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin"]);
    const body = await request.json();
    const password = String(body.password ?? "");
    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name: String(body.name ?? "").trim(),
      email: String(body.email ?? "").trim(),
      passwordHash,
      role: String(body.role ?? "sales").trim(),
      avatarUrl: String(body.avatarUrl ?? "").trim() || null,
      createdAt: new Date(),
    });

    const data = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, avatarUrl: users.avatarUrl, createdAt: users.createdAt }).from(users).orderBy(desc(users.id));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create user" }, { status: 500 });
  }
}
