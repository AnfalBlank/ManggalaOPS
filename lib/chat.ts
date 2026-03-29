import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { chatMessages, chatParticipants, chatThreads, users } from "@/db/schema";

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
  const inserted = await db.insert(chatThreads).values({ title, kind: "direct", createdByUserId, createdAt: new Date() }).returning({ id: chatThreads.id });
  const threadId = inserted[0]?.id;
  if (!threadId) throw new Error("Failed to create chat thread");
  await db.insert(chatParticipants).values(userIds.map((userId) => ({ threadId, userId })));
  return threadId;
}

export async function createProjectGroupThread(title: string, projectId: number, userIds: number[], createdByUserId: number) {
  const inserted = await db.insert(chatThreads).values({ title, kind: "project", projectId, createdByUserId, createdAt: new Date() }).returning({ id: chatThreads.id });
  const threadId = inserted[0]?.id;
  if (!threadId) throw new Error("Failed to create project chat thread");
  await db.insert(chatParticipants).values(userIds.map((userId) => ({ threadId, userId })));
  return threadId;
}

export async function createBroadcastThread(title: string, createdByUserId: number) {
  const allUsers = await db.select({ id: users.id }).from(users);
  const userIds = allUsers.map((user) => user.id);
  return createDirectThread(title, userIds, createdByUserId);
}

export async function getThreadMessages(threadId: number) {
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
  await db.insert(chatMessages).values({ threadId, senderUserId, body, createdAt: new Date() });
}
