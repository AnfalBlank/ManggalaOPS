import { NextRequest, NextResponse } from "next/server";

import { ensurePositiveInt, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import {
  ChatAccessError,
  createBroadcastThread,
  createDirectThread,
  createProjectGroupThread,
  getUserChatOverview,
  sendChatMessage,
} from "@/lib/chat";
import { getCurrentUser } from "@/lib/session-auth";

function chatErrorToResponse(error: unknown) {
  if (error instanceof ChatAccessError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  return toErrorResponse(error, "Failed to process chat");
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getUserChatOverview(user.id));
  } catch (error) {
    return chatErrorToResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const action = trimString(body.action, 100);
    const userIds = (Array.isArray(body.userIds) ? body.userIds : []).map(Number).filter((n: number) => Number.isFinite(n));

    if (action === "create-direct") {
      const title = trimString(body.title, 200) || "Direct Chat";
      const threadId = await createDirectThread(title, userIds, user.id);
      await audit({ userId: user.id, action: "chat.thread.create_direct", entity: "chat_thread", entityId: threadId });
      return NextResponse.json({ ok: true, threadId });
    }

    if (action === "create-broadcast") {
      const title = trimString(body.title, 200) || "Broadcast";
      const threadId = await createBroadcastThread(title, user.id);
      await audit({ userId: user.id, action: "chat.thread.create_broadcast", entity: "chat_thread", entityId: threadId });
      return NextResponse.json({ ok: true, threadId });
    }

    if (action === "create-project-group") {
      const title = trimString(body.title, 200) || "Project Group";
      const projectId = ensurePositiveInt(body.projectId, "projectId");
      const threadId = await createProjectGroupThread(title, projectId, userIds, user.id);
      await audit({ userId: user.id, action: "chat.thread.create_project_group", entity: "chat_thread", entityId: threadId, payload: { projectId } });
      return NextResponse.json({ ok: true, threadId });
    }

    if (action === "send-message") {
      const threadId = ensurePositiveInt(body.threadId, "threadId");
      const message = trimString(body.body, 5000);
      if (!message) {
        return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
      }
      await sendChatMessage(threadId, user.id, message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return chatErrorToResponse(error);
  }
}
