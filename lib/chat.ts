import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { chatMessages, chatParticipants, chatThreads, users } from "@/db/schema";

export class ChatAccessError extends Error {
  constructor(message = "Anda tidak punya akses ke thread ini") {
    super(message);
    this.name = "ChatAccessError";
  }
}

/**
 * Verify that a user is a participant of the given chat thread.
 * Throws ChatAccessError if not — callers should handle this as 403.
 */
export async function ensureThreadParticipant(threadId: number, userId: number) {
  const row = await db.query.chatParticipants.findFirst({
    where: and(eq(chatParticipants.threadId, threadId), eq(chatParticipants.userId, userId)),
  });
  if (!row) {
    throw new ChatAccessError();
  }
}

export async function getUserChatOverview(userId: number) {
  const participantRows = await db.select().from(chatParticipants).where(eq(chatParticipants.userId, userId));
  const threadIds = participantRows.map((row) => row.threadId);
  if (threadIds.length === 0) return [];

  const threads = await db.select().from(chatThreads).where(inArray(chatThreads.id, threadIds)).orderBy(desc(chatThreads.id));
  const messages = await db.select().from(chatMessages).where(inArray(chatMessages.threadId, threadIds)).orderBy(desc(chatMessages.id));

  return threads.map((thread) => {
    const latest = messages.find((message) => message.threadId === thread.id);
    return {
      id: thread.id,
      title: thread.title,
      kind: thread.kind,
      latestMessage: latest?.body ?? "Belum ada pesan",
      latestAt: latest?.createdAt ?? thread.createdAt,
    };
  });
}

export async function createDirectThread(title: string, userIds: number[], createdByUserId: number) {
  // Always include the creator so they can read their own thread.
  const uniqueParticipants = Array.from(new Set([createdByUserId, ...userIds.filter((id) => Number.isFinite(id))]));
  if (uniqueParticipants.length === 0) {
    throw new Error("Minimal satu participant wajib diisi");
  }

  const inserted = await db.insert(chatThreads).values({ title, kind: "direct", createdByUserId, createdAt: new Date() }).returning({ id: chatThreads.id });
  const threadId = inserted[0]?.id;
  if (!threadId) throw new Error("Failed to create chat thread");
  await db.insert(chatParticipants).values(uniqueParticipants.map((userId) => ({ threadId, userId })));
  return threadId;
}

export async function createProjectGroupThread(title: string, projectId: number, userIds: number[], createdByUserId: number) {
  const uniqueParticipants = Array.from(new Set([createdByUserId, ...userIds.filter((id) => Number.isFinite(id))]));
  const inserted = await db.insert(chatThreads).values({ title, kind: "project", projectId, createdByUserId, createdAt: new Date() }).returning({ id: chatThreads.id });
  const threadId = inserted[0]?.id;
  if (!threadId) throw new Error("Failed to create project chat thread");
  await db.insert(chatParticipants).values(uniqueParticipants.map((userId) => ({ threadId, userId })));
  return threadId;
}

export async function createBroadcastThread(title: string, createdByUserId: number) {
  const allUsers = await db.select({ id: users.id }).from(users);
  const userIds = allUsers.map((user) => user.id);
  return createDirectThread(title, userIds, createdByUserId);
}

export async function getThreadMessages(threadId: number, requestingUserId: number) {
  await ensureThreadParticipant(threadId, requestingUserId);
  const messages = await db.select().from(chatMessages).where(eq(chatMessages.threadId, threadId)).orderBy(asc(chatMessages.id));
  const senderIds = [...new Set(messages.map((message) => message.senderUserId))];
  const senders = senderIds.length ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, senderIds)) : [];
  return messages.map((message) => ({
    id: message.id,
    body: message.body,
    createdAt: message.createdAt,
    senderUserId: message.senderUserId,
    senderName: senders.find((sender) => sender.id === message.senderUserId)?.name ?? `User #${message.senderUserId}`,
  }));
}

export async function sendChatMessage(threadId: number, senderUserId: number, body: string) {
  if (!body || body.length === 0) {
    throw new Error("Pesan tidak boleh kosong");
  }
  await ensureThreadParticipant(threadId, senderUserId);
  await db.insert(chatMessages).values({ threadId, senderUserId, body, createdAt: new Date() });
}
