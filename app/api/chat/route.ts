import { NextRequest, NextResponse } from "next/server";

import { createBroadcastThread, createDirectThread, createProjectGroupThread, getUserChatOverview, sendChatMessage } from "@/lib/chat";
import { getCurrentUser } from "@/lib/session-auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getUserChatOverview(user.id));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    if (body.action === "create-direct") {
      const participants = Array.from(new Set([user.id, ...(Array.isArray(body.userIds) ? body.userIds : []).map(Number)]));
      const threadId = await createDirectThread(String(body.title ?? "Direct Chat"), participants, user.id);
      return NextResponse.json({ ok: true, threadId });
    }
    if (body.action === "create-broadcast") {
      const threadId = await createBroadcastThread(String(body.title ?? "Broadcast"), user.id);
      return NextResponse.json({ ok: true, threadId });
    }
    if (body.action === "create-project-group") {
      const threadId = await createProjectGroupThread(String(body.title ?? "Project Group"), Number(body.projectId), (Array.isArray(body.userIds) ? body.userIds : []).map(Number), user.id);
      return NextResponse.json({ ok: true, threadId });
    }
    if (body.action === "send-message") {
      await sendChatMessage(Number(body.threadId), user.id, String(body.body ?? "").trim());
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to process chat" }, { status: 500 });
  }
}
