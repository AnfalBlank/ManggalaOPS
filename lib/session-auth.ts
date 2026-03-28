import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import type { AppRole } from "@/lib/auth";

const SESSION_COOKIE = "manggala_session";

export async function loginWithPassword(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error("Email atau password salah");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Email atau password salah");
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    createdAt: new Date(),
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  cookieStore.set("manggala_role", user.role as AppRole, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return user;
}

export async function logoutSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("manggala_role");
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });

  if (!session || (session.expiresAt && new Date(session.expiresAt) < new Date())) {
    cookieStore.delete(SESSION_COOKIE);
    cookieStore.delete("manggala_role");
    return null;
  }

  return db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
}
